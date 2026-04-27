import React, { useState } from "react";
import { Search, X } from "lucide-react";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    const handleClear = () => {
        setSearchTerm("");
        onSearch("");
    };

    return (
        <div className="search-bar-container">
            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search by track name or artist..."
                    value={searchTerm}
                    onChange={handleChange}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="clear-button"
                        aria-label="Clear search"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
