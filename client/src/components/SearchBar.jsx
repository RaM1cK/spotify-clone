import React, { useState, useRef, useEffect } from "react";
import { Search, X, Loader } from "lucide-react";
import "./SearchBar.css";
import axios from "axios";

const SearchBar = ({searchTerm, setSearchTerm, isLoading, setIsLoading, setData}) => {
    const debounceTimer = useRef(null);

    const handleSearch = (searchQuery) =>
        axios.get(`/api/users/search?query=${searchQuery}`)
            .then(res => setData(res.data))
            .catch(err => console.log(err));

    const handleChange = (e) => {
        const value = e.target.value;

        setSearchTerm(value);
        setIsLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            if (value) handleSearch(value);
            setIsLoading(false);
        }, 500);
    };

    const handleClear = () => {
        setSearchTerm("");
        setIsLoading(false);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
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
                    placeholder="Название трека, альбома, артиста..."
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
