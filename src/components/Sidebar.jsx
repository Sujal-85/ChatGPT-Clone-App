import { useState, useEffect, useRef } from "react";

function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatIndex, setSelectedChatIndex] = useState(null); // Track selected chat
  const [menuOpenIndex, setMenuOpenIndex] = useState(null); // Track which chat's menu is open
  const menuRefs = useRef([]); // Refs for dropdown menus to handle outside clicks

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768; // Tailwind's md breakpoint
    setIsSidebarOpen(isDesktop);
  }, []);

  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Load chat history from localStorage when component mounts
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Filter out any invalid entries
        const validHistory = parsedHistory.filter(
          (chat) => chat && chat.query && typeof chat.query === 'string'
        );
        setChatHistory(validHistory);
      } catch (error) {
        console.error('Error parsing chat history:', error);
        setChatHistory([]);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (isSearching) {
      setIsSearching(false); // Close search bar when sidebar closes
      setSearchQuery(""); // Clear search query
    }
  };

  // Listen for new chat messages from MainContent
  useEffect(() => {
    const handleNewChat = (event) => {
      if (event.detail && event.detail.message) {
        const newHistory = [
          ...chatHistory,
          {
            query: event.detail.message,
            response: event.detail.response || 'No response received',
            timestamp: new Date().toISOString(),
          },
        ];
        setChatHistory(newHistory);
        localStorage.setItem('chatHistory', JSON.stringify(newHistory));
      }
    };

    window.addEventListener('newChatMessage', handleNewChat);
    return () => window.removeEventListener('newChatMessage', handleNewChat);
  }, [chatHistory]);

  const filteredChats = chatHistory.filter(
    (chat) =>
      chat.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.response &&
        chat.response.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle deleting a chat
  const handleDeleteChat = (index) => {
    const newHistory = chatHistory.filter((_, i) => i !== index);
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));

    // If this was the last chat, refresh the page
    if (newHistory.length === 0) {
      window.location.reload();
      return;
    }

    // If the deleted chat was selected, select the next available chat
    if (selectedChatIndex === index) {
      const nextIndex = index >= newHistory.length ? newHistory.length - 1 : index;
      setSelectedChatIndex(nextIndex);
      // Load the next chat
      window.dispatchEvent(new CustomEvent('loadChat', {
        detail: {
          message: newHistory[nextIndex].query,
          response: newHistory[nextIndex].response || 'No response received'
        }
      }));
    } else if (selectedChatIndex > index) {
      // If a chat before the selected one was deleted, adjust the selected index
      setSelectedChatIndex(selectedChatIndex - 1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpenIndex !== null &&
        menuRefs.current[menuOpenIndex] &&
        !menuRefs.current[menuOpenIndex].contains(event.target)
      ) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenIndex]);

  return (
    <>
      {/* Backdrop - only shown on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'h-screen w-64 md:w-1/5 flex flex-col'
            : 'h-[60px] md:h-screen w-16 flex flex-col'
        } bg-white dark:bg-[#161616] shadow-lg sidebar ${
          isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
      >
        {/* Fixed Top Section */}
        <div className="p-2">
          {/* Mobile menu button and icons - shown only on mobile */}
          <div className="md:hidden flex justify-between items-center mb-4">
            <button
              className="p-2"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-xl-heavy dark:text-white"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-xl-heavy dark:text-white"
                >
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A1A1A] focus:outline-none"
                    aria-label="Search"
                    onClick={() => setIsSearching((prev) => !prev)}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon-xl-heavy text-gray-500 dark:text-white"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 4.25C7.16015 4.25 4.25 7.16015 4.25 10.75C4.25 14.3399 7.16015 17.25 10.75 17.25C14.3399 17.25 17.25 14.3399 17.25 10.75C17.25 7.16015 14.3399 4.25 10.75 4.25ZM2.25 10.75C2.25 6.05558 6.05558 2.25 10.75 2.25C15.4444 2.25 19.25 6.05558 19.25 10.75C19.25 12.7369 18.5683 14.5645 17.426 16.0118L21.4571 20.0429C21.8476 20.4334 21.8476 21.0666 21.4571 21.4571C21.0666 21.8476 20.4334 21.8476 20.0429 21.4571L16.0118 17.426C14.5645 18.5683 12.7369 19.25 10.75 19.25C6.05558 19.25 2.25 15.4444 2.25 10.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <span id="search-tooltip" className="tooltip">
                    Search
                  </span>
                </div>
                <div className="relative group">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A1A1A] focus:outline-none"
                    aria-label="New Chat"
                    onClick={() => (window.location.href = 'http://localhost:3000')}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon-xl-heavy text-gray-500 dark:text-white"
                    >
                      <path d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z" />
                    </svg>
                  </button>
                  <span id="new-chat-tooltip" className="tooltip">
                    New Chat
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop toggle button - hidden on mobile */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <button
              className="icon-button"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="icon-xl-heavy dark:text-white"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.85719 3L13.5 3C14.0523 3 14.5 3.44772 14.5 4C14.5 4.55229 14.0523 5 13.5 5H11.5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V11.5C20.5 10.9477 20.9477 10.5 21.5 10.5C22.0523 10.5 22.5 10.9477 22.5 11.5V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM9.5 19V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z"
                  fill="currentColor"
                />
                <circle cx="20" cy="5" r="4" fill="#0285FF" />
              </svg>
            </button>
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A1A1A] focus:outline-none"
                    aria-label="Search"
                    onClick={() => setIsSearching((prev) => !prev)}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon-xl-heavy text-gray-500 dark:text-white"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 4.25C7.16015 4.25 4.25 7.16015 4.25 10.75C4.25 14.3399 7.16015 17.25 10.75 17.25C14.3399 17.25 17.25 14.3399 17.25 10.75C17.25 7.16015 14.3399 4.25 10.75 4.25ZM2.25 10.75C2.25 6.05558 6.05558 2.25 10.75 2.25C15.4444 2.25 19.25 6.05558 19.25 10.75C19.25 12.7369 18.5683 14.5645 17.426 16.0118L21.4571 20.0429C21.8476 20.4334 21.8476 21.0666 21.4571 21.4571C21.0666 21.8476 20.4334 21.8476 20.0429 21.4571L16.0118 17.426C14.5645 18.5683 12.7369 19.25 10.75 19.25C6.05558 19.25 2.25 15.4444 2.25 10.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <span id="search-tooltip" className="tooltip">
                    Search
                  </span>
                </div>
                <div className="relative group">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A1A1A] focus:outline-none"
                    aria-label="New Chat"
                    onClick={() => (window.location.href = 'http://localhost:3000')}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon-xl-heavy text-gray-500 dark:text-white"
                    >
                      <path d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z" />
                    </svg>
                  </button>
                  <span id="new-chat-tooltip" className="tooltip">
                    New Chat
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ChatGPT Button - Only visible when sidebar is open */}
          {isSidebarOpen && (
            <div className="flex flex-col space-y-4">
              <a
                title="ChatGPT"
                className="no-draggable group rounded-lg active:opacity-90 bg-white dark:bg-[#1f1f1f] h-12 text-sm font-medium flex items-center gap-2.5 p-2 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors duration-200"
                href="https://chatgpt.com"
              >
                <div
                  className="flex items-center justify-center h-12 w-12 text-token-text-secondary dark:text-white"
                  style={{ fontSize: '32px' }}
                >
                  <div className="relative flex items-center justify-center w-full h-full rounded-full bg-token-main-surface-primary text-token-text-primary  dark:text-white">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-2/3 w-2/3 dark:text-white"
                    >
                      <path
                        d="M9.20509 8.76511V6.50545C9.20509 6.31513 9.27649 6.17234 9.44293 6.0773L13.9861 3.46088C14.6046 3.10413 15.342 2.93769 16.103 2.93769C18.9573 2.93769 20.7651 5.14983 20.7651 7.50454C20.7651 7.67098 20.7651 7.86129 20.7412 8.05161L16.0316 5.2924C15.7462 5.12596 15.4607 5.12596 15.1753 5.2924L9.20509 8.76511ZM19.8135 17.5659V12.1664C19.8135 11.8333 19.6708 11.5955 19.3854 11.429L13.4152 7.95633L15.3656 6.83833C15.5321 6.74328 15.6749 6.74328 15.8413 6.83833L20.3845 9.45474C21.6928 10.216 22.5728 11.8333 22.5728 13.4031C22.5728 15.2108 21.5025 16.8758 19.8135 17.5657V17.5659ZM7.80173 12.8088L5.8513 11.6671C5.68486 11.5721 5.61346 11.4293 5.61346 11.239V6.00613C5.61346 3.46111 7.56389 1.53433 10.2042 1.53433C11.2033 1.53433 12.1307 1.86743 12.9159 2.46202L8.2301 5.17371C7.94475 5.34015 7.80195 5.57798 7.80195 5.91109V12.809L7.80173 12.8088ZM12 15.2349L9.20509 13.6651V10.3351L12 8.76534L14.7947 10.3351V13.6651L12 15.2349ZM13.7958 22.4659C12.7967 22.4659 11.8693 22.1328 11.0841 21.5382L15.7699 18.8265C16.0553 18.6601 16.198 18.4222 16.198 18.0891V11.1912L18.1723 12.3329C18.3388 12.4279 18.4102 12.5707 18.4102 12.761V17.9939C18.4102 20.5389 16.4359 22.4657 13.7958 22.4657V22.4659ZM8.15848 17.1617L3.61528 14.5452C2.30696 13.784 1.42701 12.1667 1.42701 10.5969C1.42701 8.76534 2.52115 7.12414 4.20987 6.43428V11.8574C4.20987 12.1905 4.35266 12.4284 4.63802 12.5948L10.5846 16.0436L8.63415 17.1617C8.46771 17.2567 8.32492 17.2567 8.15848 17.1617ZM7.897 21.0625C5.20919 21.0625 3.23488 19.0407 3.23488 16.5432C3.23488 16.3529 3.25875 16.1626 3.28262 15.9723L7.96817 18.6839C8.25352 18.8504 8.53911 18.8504 8.82446 18.6839L14.7947 15.2351V17.4948C14.7947 17.6851 14.7233 17.8279 14.5568 17.9229L10.0136 20.5393C9.39518 20.8961 8.6578 21.0625 7.89677 21.0625H7.897ZM13.7958 23.8929C16.6739 23.8929 19.0762 21.8474 19.6235 19.1357C22.2874 18.4459 24 15.9484 24 13.4034C24 11.7383 23.2865 10.121 22.002 8.95542C22.121 8.45588 22.1924 7.95633 22.1924 7.45702C22.1924 4.0557 19.4331 1.51045 16.2458 1.51045C15.6037 1.51045 14.9852 1.60549 14.3668 1.81968C13.2963 0.773071 11.8215 0.107086 10.2042 0.107086C7.32606 0.107086 4.92383 2.15256 4.37653 4.86425C1.7126 5.55411 0 8.05161 0 10.5966C0 12.2617 0.713506 13.879 1.99795 15.0446C1.87904 15.5441 1.80764 16.0436 1.80764 16.543C1.80764 19.9443 4.56685 22.4895 7.75421 22.4895C8.39632 22.4895 9.01478 22.3945 9.63324 22.1803C10.7035 23.2269 12.1783 23.8929 13.7958 23.8929Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
                <div className="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ChatGPT
                </div>
              </a>
            </div>
          )}

          {/* Search input - visible when searching is active */}
          {isSearching && (
            <div className="px-2 mb-2">
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-200 dark:bg-[#2A2A2A] focus:outline-none text-black dark:text-white"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search chats"
              />
            </div>
          )}

          {/* Scrollable Chat List Section */}
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-2">
                {(isSearching ? filteredChats : chatHistory).map((chat, index) => (
                  <div
                    key={index}
                    className="relative"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuOpenIndex(index); // Open menu on right-click
                    }}
                  >
                    <button
                      className={`w-full text-left p-2 rounded-lg transition-colors duration-200 flex justify-between items-center ${
                        selectedChatIndex === index
                          ? 'bg-[#eeeeee] dark:bg-[#1f1f1f]'
                          : 'hover:bg-gray-200 dark:hover:bg-[#1f1f1f]'
                      }`}
                      onClick={() => {
                        setSelectedChatIndex(index);
                        window.dispatchEvent(
                          new CustomEvent('loadChat', {
                            detail: {
                              message: chat.query,
                              response: chat.response || 'No response received',
                            },
                          })
                        );
                      }}
                      aria-label={`Select chat ${index + 1}`}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-message-circle dark:text-white"
                          >
                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                          </svg>
                          <span className="text-md font-medium truncate text-gray-900 dark:text-white">
                            {chat.query}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 pl-6">
                          {chat.timestamp
                            ? new Date(chat.timestamp).toLocaleString()
                            : 'Unknown time'}
                        </div>
                      </div>
                      {/* Three-dot button */}
                      <button
                        className="p-1 rounded hover:bg-gray-300 dark:hover:bg-[#2A2A2A]"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent chat selection on three-dot click
                          setMenuOpenIndex(menuOpenIndex === index ? null : index);
                        }}
                        aria-label="Chat options"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-gray-500 dark:text-gray-300"
                        >
                          <circle cx="12" cy="12" r="1" fill="currentColor" />
                          <circle cx="12" cy="5" r="1" fill="currentColor" />
                          <circle cx="12" cy="19" r="1" fill="currentColor" />
                        </svg>
                      </button>
                    </button>
                    {/* Dropdown Menu */}
                    {menuOpenIndex === index && (
                      <div
                        ref={(el) => (menuRefs.current[index] = el)}
                        className="absolute -right-2 top-16 md:top-12 bg-white dark:bg-[#2A2A2A] shadow-lg rounded-md z-50"
                      >
                        <button
                          className="block w-full text-left px-4 py-2 text-sm  text-red-600 hover:rounded-md dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3A3A3A]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(index);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            .tooltip {
              visibility: hidden;
              position: absolute;
              top: calc(100% + 8px);
              left: 50%;
              transform: translateX(-50%);
              background-color: black;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 10;
              opacity: 0;
              transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .dark .tooltip {
              background-color: black;
              color: white;
              border: 1px solid #444;
            }
            .group:hover .tooltip,
            .group:focus-within .tooltip {
              visibility: visible;
              opacity: 1;
            }
            .tooltip::after {
              content: '';
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              border-width: 5px;
              border-style: solid;
              border-color: transparent transparent black transparent;
            }
            .dark .tooltip::after {
              border-color: transparent transparent black transparent;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

export default Sidebar;