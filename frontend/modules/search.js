import axios from "axios";
import DOMPurify from "dompurify";

export default class Search {
  // selector
  constructor() {
    this.injectHTML();
    this.searchBox = document.querySelector("#search");
    this.searchIcon = document.querySelector("#search-open");
    this.searchClose = document.querySelector("#search-close");
    this.searchField = document.querySelector("#search-field");
    this.searchResultWrap = document.querySelector("#search-result-wrap");
    this.searchResult = document.querySelector("#search-result");
    this.searchLoad = document.querySelector("#search-load");
    this.searchTimer;
    this.prevValue = "";
    this.events();
  }
  // events
  events() {
    this.searchIcon.addEventListener("click", () => {
      this.openSearch();
    });
    this.searchClose.addEventListener("click", () => {
      this.closeSearch();
    });
    this.searchField.addEventListener("keyup", () => {
      this.keyHandler();
    });
  }
  // methods
  openSearch() {
    this.searchBox.classList.add("search-visible");
    setTimeout(() => {
      this.searchField.focus();
    }, 50);
  }
  closeSearch() {
    this.searchBox.classList.remove("search-visible");
  }
  keyHandler() {
    let value = this.searchField.value;

    if (value == "") {
      clearTimeout(this.searchTimer);
      this.hideLoader();
      this.hideResult();
    }

    if (value != "" && value != this.prevValue) {
      clearTimeout(this.searchTimer);
      this.showLoader();
      this.hideResult();
      this.searchTimer = setTimeout(() => {
        this.sendRequest();
      }, 800);
    }
    this.prevValue = value;
  }
  sendRequest() {
    axios
      .post("/search", { searchTerm: this.searchField.value })
      .then((res) => {
        this.renderResult(res.data);
      })
      .catch(() => {
        console.log("Test Failed");
      });
  }
  renderResult(posts) {
    if (posts.length) {
      this.searchResult.innerHTML = DOMPurify.sanitize(
        `
        <div>
          <div class="bg-indigo-400 p-6 rounded">
            <h1 class="text-2xl text-white">Search result (${
              posts.length > 1 ? `${posts.length} posts found` : "1 post found"
            })</h1>
          </div>
          
          ${posts
            .map((post) => {
              let postDate = new Date(post.createdDate);
              return `
                <a href="/post/${
                  post._id
                }" class="flex items-center my-6 hover:bg-indigo-100 transition-all p-2 rounded">
                  <div class="mr-3">
                    <img src="${
                      post.author.avatar
                    }" alt="avatar" class="w-10 h-10 object-cover rounded-full max-w-none">
                  </div>
                  <div class="flex items-center">
                    <p class="text-xl font-bold mr-3">${post.title}</p>
                    <span>By: ${post.author.username} (${
                postDate.getMonth() + 1
              }/${postDate.getDate()}/${postDate.getFullYear()})</span>
                  </div>
                </a>
                <hr>
            `;
            })
            .join("")}
        </div>
        `
      );
    } else {
      this.searchResult.innerHTML = `
        <p class="text-red-400">That post does not exist.</p>
      `;
    }
    this.hideLoader();
    this.showResult();
  }
  showLoader() {
    this.searchLoad.classList.remove("invisible");
  }
  hideLoader() {
    this.searchLoad.classList.add("invisible");
  }
  showResult() {
    this.searchResultWrap.classList.remove("invisible");
  }
  hideResult() {
    this.searchResultWrap.classList.add("invisible");
  }
  injectHTML() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
    <div id="search" class="fixed h-screen w-screen top-0 left-0 bg-black bg-opacity-80 flex flex-col items-center px-4 opacity-0 transform scale-125 invisible overflow-hidden transition-all duration-500 ease-in-out">
  
    <div class="mt-52 bg-black p-4 w-full md:w-7/12 h-28 rounded flex relative">
    
      <div id="search-close" class="absolute top-0 right-0 transform -translate-y-full cursor-pointer">
        <i class="far fa-times-circle text-indigo-400 text-2xl"></i>
      </div>
      <div class="w-full relative">
        <input id="search-field" type="text" placeholder="Looking for a post?" class="text-3xl font-light p-6 rounded w-full focus:outline-none focus:ring focus:ring-indigo-500">
        <i class="fas fa-search text-3xl absolute top-0 right-0 transform translate-y-full text-indigo-400 pr-6"></i>
      </div>
    </div>
    
    <div id="search-load" class="mt-5 invisible">
      <svg class="animate-spin -ml-1 mr-3 h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div id="search-result-wrap" class="mt-10 bg-white w-full md:w-7/12 rounded-md shadow invisible">
      <div class="p-4" id="search-result"></div>
    </div>
  </div>
    `
    );
  }
}
