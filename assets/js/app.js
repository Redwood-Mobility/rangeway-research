// Configuration
const WORKER_URL = 'https://n8n.winnick.cloud/webhook/rangeway-research';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const quickSearchTags = document.querySelectorAll('.quick-search-tag');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const errorSection = document.getElementById('error');
const logoContainer = document.querySelector('.logo-container');

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

// Logo click to refresh/start over
logoContainer.addEventListener('click', () => {
  location.reload();
});
logoContainer.style.cursor = 'pointer';

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

  console.log('Raw response:', data);

  // Handle the n8n response format: [{ "text": "markdown content" }]
  let markdownContent = '';
  
  if (Array.isArray(data) && data.length > 0 && data[0].text) {
    markdownContent = data[0].text;
  } else if (typeof data === 'string') {
    markdownContent = data;
  } else if (data.text) {
    markdownContent = data.text;
  } else if (data.output) {
    markdownContent = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
  }

  // Parse the markdown into sections
  const sections = parseMarkdownSections(markdownContent);
  
  // Display Summary (first paragraph or intro)
  if (sections.summary) {
    summaryContent.innerHTML = formatMarkdown(sections.summary);
  } else {
    summaryContent.textContent = 'Research complete. See findings below.';
  }

  // Display main content sections as insight cards
  insightsGrid.innerHTML = '';
  
  if (sections.mainSections.length > 0) {
    sections.mainSections.forEach(section => {
      insightsGrid.appendChild(createMarkdownInsightCard(section.title, section.content));
    });
  }

  // Clear sources grid (we don't have structured sources in markdown format)
  sourcesGrid.innerHTML = '';
  
  // Display Rangeway Implications
  implicationsList.innerHTML = '';
  if (sections.implications) {
    const items = sections.implications.split('\n').filter(line => line.trim().startsWith('**') || line.trim().startsWith('-'));
    items.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = formatMarkdown(item.replace(/^[-*]\s*/, ''));
      implicationsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'Review the research findings above for strategic insights.';
    implicationsList.appendChild(li);
  }
}

// Parse markdown into logical sections
function parseMarkdownSections(markdown) {
  const result = {
    summary: '',
    mainSections: [],
    implications: ''
  };

  if (!markdown) return result;

  // Split by ## headers
  const parts = markdown.split(/(?=^## )/gm);
  
  parts.forEach((part, index) => {
    const lines = part.trim().split('\n');
    const firstLine = lines[0];
    
    // Check if this is a header section
    if (firstLine.startsWith('## ')) {
      const title = firstLine.replace('## ', '').trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (title.toLowerCase().includes('implication') || title.toLowerCase().includes('rangeway')) {
        result.implications = content;
      } else {
        result.mainSections.push({ title, content });
      }
    } else if (firstLine.startsWith('# ')) {
      // Main title - use content after title as summary
      const title = firstLine.replace('# ', '').trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Find first paragraph as summary
      const firstParagraph = content.split('\n\n')[0];
      if (firstParagraph && !firstParagraph.startsWith('##')) {
        result.summary = firstParagraph;
      } else {
        result.summary = `Research findings for: ${title}`;
      }
    } else if (index === 0 && part.trim()) {
      // First part without header - treat as summary
      result.summary = part.trim().split('\n\n')[0];
    }
  });

  return result;
}

// Create an insight card from markdown section
function createMarkdownInsightCard(title, content) {
  const card = document.createElement('div');
  card.className = 'insight-card';
  
  // Determine category color based on title keywords
  let category = 'trends';
  const titleLower = title.toLowerCase();
  if (titleLower.includes('contrarian') || titleLower.includes('challenge')) {
    category = 'contrarian';
  } else if (titleLower.includes('success') || titleLower.includes('case') || titleLower.includes('example')) {
    category = 'case_study';
  } else if (titleLower.includes('misconception') || titleLower.includes('myth') || titleLower.includes('truth')) {
    category = 'misconception';
  } else if (titleLower.includes('metric') || titleLower.includes('data') || titleLower.includes('number') || titleLower.includes('funding') || titleLower.includes('competitive')) {
    category = 'metrics';
  }
  
  card.innerHTML = `
    <h3 class="${category}">${escapeHtml(title)}</h3>
    <div class="insight-content">${formatMarkdown(content)}</div>
  `;
  
  return card;
}

// Simple markdown to HTML formatter
function formatMarkdown(text) {
  if (!text) return '';
  
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^(.+)$/, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Citation references like [1]
    .replace(/\[(\d+)\]/g, '<sup class="citation">[$1]</sup>');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}