class PredictiveSearch extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input[type="search"]');
    
    this.predictiveSearchResults = this.querySelector('#predictive-search');

    this.input.addEventListener('input', this.debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));
  }

  onChange() {
    const searchTerm = this.input.value.trim();

    if (!searchTerm.length) {
      this.close();
      return;
    }
    if(searchTerm.length >= 3 ) {
      this.getSearchResults(searchTerm);
    }
    
  }

  getSearchResults(searchTerm) {
    const url = `/search/suggest?q=${searchTerm}&resources[type]=product,page,article,collection&section_id=predictive-search`;
    // const url = `/search?type=product&q=${searchTerm}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
        this.predictiveSearchResults.innerHTML = resultsMarkup;
        this.open();
      })
      .catch((error) => {
        this.close();
        throw error;
      });
      
  }

  open() {
    this.predictiveSearchResults.style.display = 'block';
    this.input.focus();
  }

  close() {
    this.predictiveSearchResults.style.display = 'none';
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('predictive-search', PredictiveSearch);

function openSearch() {
  const input = document.getElementById("Search");
  document.getElementById("search-overlay").style.display = "block";
  setTimeout(function() { input.focus() }, 600);
}

function closeSearch() {
  document.getElementById("search-overlay").style.display = "none";
}
