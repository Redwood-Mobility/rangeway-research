// Configuration
const WORKER_URL = 'https://n8n.winnick.cloud/webhook/rangeway-research';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const quickSearchTags = document.querySelectorAll('.quick-search-tag');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const errorSection = document.getElementById('error');

// Results Elements
const summaryContent = document.getElementById('summary-content');
const sourcesGrid = document.getElementById('sources-grid');
const insightsGrid = document.getElementById('insights-grid');
const implicationsList = document.getElementById('implications-list');

// Event Listeners
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

quickSearchTags.forEach(tag => {
  tag.addEventListener('click', () => {
    searchInput.value = tag.dataset.query;
    performSearch();
  });
});

// Main Search Function
async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  // Show loading state
  showLoading();
  
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: query })
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Search error:', error);
    showError(error.message);
  }
}

// Display Functions
function showLoading() {
  loadingSection.classList.add('active');
  resultsSection.classList.remove('active');
  errorSection.classList.remove('active');
  searchButton.disabled = true;
  searchButton.textContent = 'Searching...';
}

function showError(message) {
  loadingSection.classList.remove('active');
  resultsSection.classList.remove('active');
  errorSection.classList.add('active');
  errorSection.textContent = `Error: ${message}. Please try again.`;
  searchButton.disabled = false;
  searchButton.textContent = 'Search';
}

function displayResults(data) {
  loadingSection.classList.remove('active');
  errorSection.classList.remove('active');
  resultsSection.classList.add('active');
  searchButton.disabled = false;
  searchButton.textContent = 'Search';

  // Handle different response structures
  let results = data;
  
  // If the response is wrapped in an output array (n8n format)
  if (data.output) {
    try {
      results = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
    } catch (e) {
      results = data;
    }
  }

  // Display Summary
  if (results.search_summary) {
    summaryContent.textContent = results.search_summary;
  } else {
    summaryContent.textContent = 'Research complete. See findings below.';
  }

  // Display Sources
  sourcesGrid.innerHTML = '';
  if (results.results && Array.isArray(results.results)) {
    results.results.forEach(source => {
      sourcesGrid.appendChild(createSourceCard(source));
    });
  }

  // Display Insights
  insightsGrid.innerHTML = '';
  if (results.research_insights) {
    const insights = results.research_insights;
    
    if (insights.trends_and_developments?.length) {
      insightsGrid.appendChild(createInsightCard('Trends & Developments', 'trends', insights.trends_and_developments));
    }
    if (insights.contrarian_viewpoints?.length) {
      insightsGrid.appendChild(createInsightCard('Contrarian Viewpoints', 'contrarian', insights.contrarian_viewpoints));
    }
    if (insights.success_stories?.length) {
      insightsGrid.appendChild(createInsightCard('Success Stories', 'case_study', insights.success_stories));
    }
    if (insights.misconceptions?.length) {
      insightsGrid.appendChild(createInsightCard('Misconceptions', 'misconception', insights.misconceptions));
    }
    if (insights.key_metrics?.length) {
      insightsGrid.appendChild(createInsightCard('Key Metrics', 'metrics', insights.key_metrics));
    }
  }

  // Display Rangeway Implications
  implicationsList.innerHTML = '';
  if (results.rangeway_implications) {
    let implications = results.rangeway_implications;
    
    // Handle if it's a string (parse bullet points)
    if (typeof implications === 'string') {
      implications = implications.split('\n').filter(line => line.trim());
    }
    
    // Handle if it's an array
    if (Array.isArray(implications)) {
      implications.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.replace(/^[-•*]\s*/, '');
        implicationsList.appendChild(li);
      });
    }
  } else {
    // Default message if no implications
    const li = document.createElement('li');
    li.textContent = 'Review the research findings above for strategic insights.';
    implicationsList.appendChild(li);
  }
}

// Helper Functions
function createSourceCard(source) {
  const card = document.createElement('div');
  card.className = 'source-card';
  
  const category = source.category || 'trends';
  const categoryLabel = formatCategory(category);
  
  card.innerHTML = `
    <span class="category ${category}">${categoryLabel}</span>
    <h3>${escapeHtml(source.title || 'Source')}</h3>
    <p>${escapeHtml(source.snippet || '')}</p>
    ${source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">Read more →</a>` : ''}
  `;
  
  return card;
}

function createInsightCard(title, category, items) {
  const card = document.createElement('div');
  card.className = 'insight-card';
  
  const itemsHtml = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  
  card.innerHTML = `
    <h3 class="${category}">${title}</h3>
    <ul>${itemsHtml}</ul>
  `;
  
  return card;
}

function formatCategory(category) {
  const labels = {
    'trends': 'Trends',
    'contrarian': 'Contrarian',
    'case_study': 'Case Study',
    'misconception': 'Myth Buster',
    'metrics': 'Data Point'
  };
  return labels[category] || category;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
