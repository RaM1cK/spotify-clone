import React, { useState, useRef, useEffect } from "react";
import { Search, X, Loader } from "lucide-react";
import "./SearchBar.css";

const SearchBar = ({ onSearch = () => {} }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef(null);

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setIsLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            if (typeof onSearch === 'function') {
                onSearch(value);
            }
            setIsLoading(false);
        }, 500);
    };

    const handleClear = () => {
        setSearchTerm("");
        setIsLoading(false);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        if (typeof onSearch === 'function') {
            onSearch("");
        }
    };

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

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
                {isLoading && <Loader className="spinner" size={20} />}
                {searchTerm && !isLoading && (
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
