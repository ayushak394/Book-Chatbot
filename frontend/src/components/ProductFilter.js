/**
 * ProductFilter.js
 
 * This component provides UI controls for users to filter products by genre and price range.
 * It captures filter input, updates filter state in the parent, and triggers the filter application
 * process via a provided callback.
 *

 */

import React from 'react';
import './CSS/ProductFilter.css';

function ProductFilter({ filters, onFilterChange, onApplyFilters }) {
    const genres = ["", "Fantasy", "Science Fiction", "Mystery", "Thriller", "Horror", "Romance", "Biography"];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleApplyClick = () => {
        onApplyFilters('');
    };

    return (
        <div className="product-filter-container">
            <h3>Filter Products</h3>
            <div className="filter-group">
                <label htmlFor="genre-filter">Genre:</label>
                <select
                    id="genre-filter"
                    name="genre"
                    value={filters.genre}
                    onChange={handleInputChange}
                >
                    {genres.map(genre => (
                        <option key={genre} value={genre}>{genre || "All Genres"}</option>
                    ))}
                </select>
            </div>
            <div className="filter-group">
                <label>Price Range:</label>
                <input
                    type="number"
                    name="minPrice"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={handleInputChange}
                />
                <span> - </span>
                <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={handleInputChange}
                />
            </div>
            <button onClick={handleApplyClick} className="apply-filters-button">Apply Filters</button>
        </div>
    );
}

export default ProductFilter;