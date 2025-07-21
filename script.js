document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-destinations').addEventListener('click', loadDestinations);
    document.getElementById('add-destination-form').addEventListener('submit', addDestination);
    
    document.getElementById('save-preference').addEventListener('click', savePreference);
    document.getElementById('load-preferences').addEventListener('click', loadPreferences);
    
    document.getElementById('preference-list').addEventListener('click', (e) => {
        const prefItem = e.target.closest('.preference-item');
        if (prefItem) {
            showPreferenceDetails(prefItem.dataset.label);
        }
    });
});

async function loadDestinations() {
    try {
        const response = await fetch('http://localhost:3000/destinations');
        if (!response.ok) throw new Error('Failed to load destinations');
        
        const data = await response.json();
        const container = document.getElementById('destinations-container');
        container.innerHTML = '';
        
        if (data.length === 0) {
            container.innerHTML = '<p class="info">No destinations available</p>';
            return;
        }
        
        data.forEach(dest => {
            const destItem = document.createElement('div');
            destItem.className = 'destination-item';
            destItem.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${dest.name}</span>
            `;
            destItem.onclick = () => showDestinationDetails(dest.id);
            container.appendChild(destItem);
        });
    } catch (error) {
        document.getElementById('destinations-container').innerHTML = `
            <p class="error">Error loading destinations: ${error.message}</p>
        `;
    }
}

async function showDestinationDetails(id) {
    try {
        const response = await fetch(`http://localhost:3000/destinations/${id}`);
        if (!response.ok) throw new Error('Destination not found');
        
        const destination = await response.json();
        document.getElementById('destination-details').innerHTML = `
            <h3>${destination.name}</h3>
            <p><i class="fas fa-temperature-high"></i> <strong>Climate:</strong> ${destination.climate}</p>
            <p><i class="fas fa-money-bill-wave"></i> <strong>Budget:</strong> ${destination.budget}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Best Time:</strong> ${destination.bestTime}</p>
        `;
    } catch (error) {
        document.getElementById('destination-details').innerHTML = `
            <p class="error">Error loading details: ${error.message}</p>
        `;
    }
}

async function addDestination(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('http://localhost:3000/destinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add destination');
        }
        
        const result = await response.json();
        alert(`Successfully added: ${result.name}`);
        e.target.reset();
        loadDestinations();
    } catch (error) {
        alert(`Error adding destination: ${error.message}`);
    }
}

async function savePreference() {
    const userId = "user1";
    const climate = document.getElementById('pref-climate').value;
    const budget = document.getElementById('pref-budget').value;
    
    if (!climate || !budget) {
        alert('Please select both climate and budget');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, climate, budget })
        });
        
        if (!response.ok) throw new Error('Failed to save preference');
        
        const result = await response.json();
        alert(`Preference saved as ${result.label}`);
        document.getElementById('pref-climate').value = '';
        document.getElementById('pref-budget').value = '';
        loadPreferences();
    } catch (error) {
        alert(`Error saving preference: ${error.message}`);
    }
}

async function loadPreferences() {
    const userId = "user1";
    try {
        const response = await fetch(`http://localhost:3000/preferences/${userId}`);
        if (!response.ok) throw new Error('Failed to load preferences');
        
        const preferences = await response.json();
        const container = document.getElementById('preference-list');
        container.innerHTML = '';
        
        if (preferences.length === 0) {
            container.innerHTML = '<p class="info">No preferences saved yet</p>';
            return;
        }
        
        preferences.forEach(pref => {
            const prefItem = document.createElement('div');
            prefItem.className = 'preference-item';
            prefItem.dataset.label = pref.label;
            prefItem.innerHTML = `
                <i class="fas fa-star"></i>
                <span>${pref.label}</span>
            `;
            container.appendChild(prefItem);
        });
    } catch (error) {
        document.getElementById('preference-list').innerHTML = `
            <p class="error">Error loading preferences: ${error.message}</p>
        `;
    }
}

async function showPreferenceDetails(label) {
    const userId = "user1";
    try {
        const response = await fetch(`http://localhost:3000/preferences/${userId}/${encodeURIComponent(label)}`);
        if (!response.ok) throw new Error('Preference not found');
        
        const details = await response.json();
        document.getElementById('preference-details').innerHTML = `
            <h3>${details.label}</h3>
            <p><strong>Climate:</strong> ${details.climate}</p>
            <p><strong>Budget:</strong> ${details.budget}</p>
        `;
    } catch (error) {
        document.getElementById('preference-details').innerHTML = `
            <p class="error">Error loading details: ${error.message}</p>
        `;
    }
}