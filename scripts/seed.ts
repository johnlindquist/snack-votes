async function seed() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/seed', {
      method: 'POST',
      headers: {
        Authorization: 'Basic myplainTextAdminCreds',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Successfully seeded pairs:', data);
    } else {
      console.error('Failed to seed pairs:', await response.text());
    }
  } catch (error) {
    console.error('Error seeding pairs:', error);
  }
}

seed();
