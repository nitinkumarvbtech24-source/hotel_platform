import { useEffect, useState } from 'react';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';

import {
    Trash2,
    Plus,
    Upload,
    FileSpreadsheet,
    FileText,
    Gift,
    Folder,
    LayoutGrid
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { db } from '../firebase';
import ComboBuilderModal from '../components/ComboBuilderModal';
import ManagementSidebar from '../components/ManagementSidebar';
import '../Styles/menuManagement.css';
import '../Styles/dashboard.css';
import EditDishModal from '../components/EditDishModal';

export default function MenuManagement() {
    const hotelId = localStorage.getItem('hotelId');
    const role = localStorage.getItem('userRole');

    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [newCategory, setNewCategory] = useState('');
    const [newCounter, setNewCounter] = useState('');
    const [showComboBuilder, setShowComboBuilder] = useState(false);

    const [dish, setDish] = useState({
        name: '',
        price: '',
        category: '',
        imageUrl: '',
        description: '',
        available: true,
        count: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const catSnap = await getDocs(
            collection(db, 'hotels', hotelId, 'categories')
        );

        const itemSnap = await getDocs(
            collection(db, 'hotels', hotelId, 'menu')
        );

        setCategories(
            catSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        );

        setItems(
            itemSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        );
    };

    const addCategory = async () => {
        if (!newCategory.trim() || !newCounter.trim()) {
            alert('Please enter both Category Name and Counter Number');
            return;
        }

        await addDoc(
            collection(db, 'hotels', hotelId, 'categories'),
            { 
                name: newCategory,
                counterNumber: newCounter 
            }
        );

        setNewCategory('');
        setNewCounter('');
        fetchData();
    };

    const deleteCategory = async (category) => {
        const hasItems = items.some(
            item => item.category?.toLowerCase() === category.name?.toLowerCase()
        );

        if (hasItems) {
            alert('Cannot delete category with dishes inside. Please move or delete the dishes first.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
            await deleteDoc(
                doc(db, 'hotels', hotelId, 'categories', category.id)
            );
            fetchData();
        }
    };

    const addDish = async () => {
        if (!dish.name || !dish.price || !dish.category) return;

        const selectedCat = categories.find(c => c.name === dish.category);
        
        await addDoc(
            collection(db, 'hotels', hotelId, 'menu'),
            {
                ...dish,
                isCombo: false,
                comboItems: [],
                uniqueCode: `DISH-${Date.now()}`,
                counterNumber: selectedCat?.counterNumber || '1'
            }
        );

        setDish({
            name: '',
            price: '',
            category: '',
            imageUrl: '',
            description: '',
            available: true,
            count: 1
        });

        fetchData();
    };

    const deleteDish = async (id) => {
        console.log("Attempting to delete dish with ID:", id, "for hotel:", hotelId);
        try {
            await deleteDoc(
                doc(db, 'hotels', hotelId, 'menu', id)
            );
            console.log("Dish deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting dish:", error);
            alert("Failed to delete dish. Please check your connection.");
        }
    };

    const toggleAvailability = async (item) => {
        await updateDoc(
            doc(db, 'hotels', hotelId, 'menu', item.id),
            {
                available: !item.available
            }
        );

        fetchData();
    };

    const handleBulkImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt) => {
            const data = new Uint8Array(evt.target.result);

            const workbook = XLSX.read(data, {
                type: 'array'
            });

            const sheet =
                workbook.Sheets[workbook.SheetNames[0]];

            const rows =
                XLSX.utils.sheet_to_json(sheet);

            await Promise.all(
                rows.map(async row => {
                    const matchedCat = categories.find(c => c.name?.toLowerCase() === row.category?.toLowerCase());
                    return addDoc(
                        collection(db, 'hotels', hotelId, 'menu'),
                        {
                            ...row,
                            isCombo: false,
                            comboItems: [],
                            uniqueCode: `DISH-${Date.now()}-${Math.random()}`,
                            counterNumber: row.counterNumber || matchedCat?.counterNumber || '1'
                        }
                    );
                })
            );

            fetchData();
        };

        reader.readAsArrayBuffer(file);
    };
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleExport = (type) => {
        const worksheet =
            XLSX.utils.json_to_sheet(items);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Menu'
        );

        XLSX.writeFile(
            workbook,
            `menu-export.${type}`
        );
    };

    return (
        <>
            <div className="menu-wrapper" style={{ padding: 0, minHeight: 'auto' }}>
                <div className="floating-orb orb-1"></div>
                <div className="floating-orb orb-2"></div>
                <div className="floating-orb orb-3"></div>
                <div className="menu-hero-header">
                    <div className="hero-shimmer"></div>

                    <div className="hero-content">
                        <div className="hero-left">
                            <h1>Menu Management</h1>
                            <p>
                                Create, manage and optimize your restaurant menu
                            </p>
                        </div>

                        <div className="hero-stats">
                            <div className="hero-stat-card">
                                <span>Total Categories</span>
                                <strong>{categories.length}</strong>
                            </div>

                            <div className="hero-stat-card">
                                <span>Total Dishes</span>
                                <strong>{items.length}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="header-actions premium-actions">
                        <button
                            className="combo-builder-btn"
                            onClick={() => setShowComboBuilder(true)}
                        >
                            <Gift size={18} />
                            Build Combo
                        </button>

                        <label className="import-btn">
                            <Upload size={18} />
                            Import Menu
                            <input
                                type="file"
                                hidden
                                accept=".csv,.xlsx,.xls"
                                onChange={handleBulkImport}
                            />
                        </label>

                        <button
                            className="export-btn"
                            onClick={() => handleExport('csv')}
                        >
                            <FileText size={18} />
                            Export CSV
                        </button>

                        <button
                            className="export-btn excel"
                            onClick={() => handleExport('xlsx')}
                        >
                            <FileSpreadsheet size={18} />
                            Export Excel
                        </button>
                    </div>
                </div>

                <div className="menu-top-grid">
                    <div className="glass-card category-manager">
                        <div className="card-header">
                            <h2>Categories</h2>
                            <span className="count-badge">{categories.length} Types</span>
                        </div>

                        <div className="category-input-group dual-input">
                            <input
                                placeholder="Category Name..."
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />
                            <input
                                className="counter-input"
                                placeholder="Counter #"
                                type="text"
                                value={newCounter}
                                onChange={(e) => setNewCounter(e.target.value)}
                            />
                            <button className="add-cat-btn" onClick={addCategory}>
                                <Plus size={18} />
                                Add
                            </button>
                        </div>

                        <div className="category-modern-list">
                            <div 
                                className={`category-row ${selectedCategory === 'All' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('All')}
                            >
                                <div className="row-info">
                                    <LayoutGrid size={18} />
                                    <span>All Dishes</span>
                                </div>
                                <span className="item-count">{items.length} items</span>
                            </div>

                            {categories.map(cat => (
                                <div 
                                    key={cat.id} 
                                    className={`category-row ${selectedCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    <div className="row-info">
                                        <Folder size={18} />
                                        <div className="cat-name-stack">
                                            <span>{cat.name}</span>
                                            <small className="counter-label">Counter: {cat.counterNumber || 'N/A'}</small>
                                        </div>
                                    </div>
                                    <div className="row-actions">
                                        <span className="item-count">
                                            {items.filter(i => i.category?.toLowerCase() === cat.name?.toLowerCase()).length} items
                                        </span>
                                        <button 
                                            className="delete-mini-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCategory(cat);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card">
                        <h2>Add Dish</h2>

                        <input
                            placeholder="Name"
                            value={dish.name}
                            onChange={(e) =>
                                setDish({
                                    ...dish,
                                    name: e.target.value
                                })
                            }
                        />

                        <input
                            placeholder="Price"
                            value={dish.price}
                            onChange={(e) =>
                                setDish({
                                    ...dish,
                                    price: e.target.value
                                })
                            }
                        />

                        <select
                            value={dish.category}
                            onChange={(e) =>
                                setDish({
                                    ...dish,
                                    category:
                                        e.target.value
                                })
                            }
                        >
                            <option value="">
                                Select Category
                            </option>

                            {categories
                                .filter(
                                    cat =>
                                        cat.name !==
                                        'Combos'
                                )
                                .map(cat => (
                                    <option
                                        key={cat.id}
                                        value={cat.name}
                                    >
                                        {cat.name}
                                    </option>
                                ))}
                        </select>

                        <input
                            placeholder="Image URL"
                            value={dish.imageUrl}
                            onChange={(e) =>
                                setDish({
                                    ...dish,
                                    imageUrl:
                                        e.target.value
                                })
                            }
                        />

                        <textarea
                            placeholder="Description"
                            value={dish.description}
                            onChange={(e) =>
                                setDish({
                                    ...dish,
                                    description:
                                        e.target.value
                                })
                            }
                        />

                        <button
                            className="primary-btn"
                            onClick={addDish}
                        >
                            Add Dish
                        </button>
                    </div>
                </div>

                <div className="menu-category-sections" style={{ position: 'relative', zIndex: 10 }}>
                    {(selectedCategory === 'All'
                        ? categories
                        : categories.filter(
                            cat => cat.name === selectedCategory
                        )
                    ).map(category => {
                        const categoryItems = items.filter(
                            item => item.category?.toLowerCase() === category.name?.toLowerCase()
                        );

                        if (categoryItems.length === 0) return null;

                        return (
                            <div
                                key={category.id}
                                className="menu-category-block"
                            >
                                <div className="menu-category-header">
                                    <h2>{category.name}</h2>
                                    <span>
                                        {categoryItems.length} Items
                                    </span>
                                </div>

                                <div className="horizontal-food-scroll">
                                    {categoryItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`modern-dish-card ${item.isCombo
                                                ? 'combo-highlight-card'
                                                : ''
                                                }`}
                                        >
                                            <span
                                                className={`availability-badge ${item.available
                                                    ? 'on'
                                                    : 'off'
                                                    }`}
                                            >
                                                {item.available
                                                    ? 'Available'
                                                    : 'Not Available'}
                                            </span>

                                            {item.isCombo && (
                                                <span className="combo-ribbon">
                                                    COMBO
                                                </span>
                                            )}

                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                            />

                                            <div className="dish-card-content">
                                                <h3>{item.name}</h3>
                                                <p>{item.description}</p>

                                                {item.isCombo &&
                                                    item.comboItems?.length >
                                                    0 && (
                                                        <div className="combo-preview">
                                                            <strong>
                                                                Includes:
                                                            </strong>
                                                            <ul>
                                                                {item.comboItems.map(
                                                                    (
                                                                        combo,
                                                                        i
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                i
                                                                            }
                                                                        >
                                                                            {typeof combo ===
                                                                                'object'
                                                                                ? combo.name
                                                                                : combo}
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}

                                                <div className="dish-price">
                                                    ₹{item.price}
                                                </div>

                                                <div className="food-card-actions">
                                                    <button
                                                        className="edit-food-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingItem(item);
                                                            setShowEditModal(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-food-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if(window.confirm('Delete this dish?')) {
                                                                deleteDish(item.id);
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>

                                                <div className="dish-controls">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                item.available
                                                            }
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleAvailability(item);
                                                            }}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <ComboBuilderModal
                    isOpen={showComboBuilder}
                    onClose={() =>
                        setShowComboBuilder(false)
                    }
                    hotelId={hotelId}
                    categories={categories}
                    items={items}
                    refreshData={fetchData}
                />
            </div>
                <EditDishModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    hotelId={hotelId}
                    item={editingItem}
                    categories={categories}
                    refreshData={fetchData}
                />
        </>
    );
}
