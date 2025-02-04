// auth.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rcnuumcccjvoauqazreb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbnV1bWNjY2p2b2F1cWF6cmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTYyMjAsImV4cCI6MjA0ODg5MjIyMH0.uWyddJCKlxAkXr9epKtrAjRo25KDvVl9nB933i4Jj-E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Registration
document.getElementById('register-button').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const { data, error } = await supabase
        .from('users')
        .insert([{ username, password }]); // Hash password before storing

    if (error) {
        console.error('Registration error:', error);
    } else {
        alert('Registration successful! You can now log in.');
        window.location.href = 'login.html'; // Redirect to login page after registration
    }
});

// Login
document.getElementById('login-button').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Check hashed password
        .single();

    if (error || !data) {
        console.error('Login error:', error);
        alert('Invalid username or password');
    } else {
        // Redirect to chat interface with username
        localStorage.setItem('username', username);
        window.location.href = 'index.html'; // Redirect to chat page
    }
});