/**
 * Test script to check room creation
 * Run this in browser console to debug
 */

async function testRoomCreation() {
  const { supabase } = await import('./lib/supabase.js');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User:', user);
  if (userError) {
    console.error('User error:', userError);
    return;
  }

  // Generate room code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log('Generated code:', code);

  // Try to create room
  console.log('Attempting to create room...');
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code: code,
      state: 'waiting',
    })
    .select()
    .single();

  if (roomError) {
    console.error('Room creation error:', roomError);
    console.error('Error details:', JSON.stringify(roomError, null, 2));
    return;
  }

  console.log('Room created:', room);

  // Try to add player
  console.log('Attempting to add player...');
  const { error: playerError } = await supabase
    .from('room_players')
    .insert({
      room_id: room.id,
      user_id: user.id,
      avatar: 'yellow',
      score: 0,
      is_alive: true,
    });

  if (playerError) {
    console.error('Player creation error:', playerError);
    console.error('Error details:', JSON.stringify(playerError, null, 2));
    return;
  }

  console.log('Player added successfully!');
  console.log('Room ID:', room.id);
}

// Run test
testRoomCreation();
