import { useState } from 'react';
import {
    addDoc,
    collection
} from 'firebase/firestore';
import { X, Plus } from 'lucide-react';
import { db } from '../firebase';

export default function ComboBuilderModal({
    isOpen,
    onClose,
    hotelId,
    categories,
    items,
    refreshData
}) {
    const [comboName, setComboName] = useState('');
    const [comboPrice, setComboPrice] = useState('');
    const [comboCategory, setComboCategory] = useState('');
    const [comboDescription, setComboDescription] = useState('');
    const [comboImage, setComboImage] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    if (!isOpen) return null;

    const toggleItem = (item) => {
        const exists = selectedItems.find(
            selected => selected.id === item.id
        );

        if (exists) {
            setSelectedItems(
                selectedItems.filter(
                    selected => selected.id !== item.id
                )
            );
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const saveCombo = async () => {
        if (
            !comboName ||
            !comboPrice ||
            !comboCategory ||
            !comboDescription ||
            !comboImage ||
            selectedItems.length === 0
        ) {
            alert('Fill all combo details');
            return;
        }

        await addDoc(
            collection(db, 'hotels', hotelId, 'menu'),
            {
                name: comboName,
                price: comboPrice,
                category: 'Combos',
                comboCategory,
                description: comboDescription,
                imageUrl: comboImage,
                isCombo: true,
                comboItems: selectedItems,
                available: true,
                count: 1,
                uniqueCode: `COMBO-${Date.now()}`
            }
        );

        setComboName('');
        setComboPrice('');
        setComboCategory('');
        setComboDescription('');
        setComboImage('');
        setSelectedItems([]);

        refreshData();
        onClose();
    };

    return (
        <div className="combo-modal-overlay">
            <div className="combo-modal premium-combo-modal">
                <div className="combo-modal-header">
                    <div>
                        <h2>Build Premium Combo</h2>
                        <p>Create curated meal packages for your customers</p>
                    </div>

                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="combo-form-top premium-grid">
                    <input
                        placeholder="Combo Name"
                        value={comboName}
                        onChange={(e) =>
                            setComboName(e.target.value)
                        }
                    />

                    <input
                        placeholder="Combo Price"
                        value={comboPrice}
                        onChange={(e) =>
                            setComboPrice(e.target.value)
                        }
                    />

                    <input
                        placeholder="Combo Category"
                        value={comboCategory}
                        onChange={(e) =>
                            setComboCategory(
                                e.target.value
                            )
                        }
                    />

                    <input
                        placeholder="Combo Image URL"
                        value={comboImage}
                        onChange={(e) =>
                            setComboImage(
                                e.target.value
                            )
                        }
                    />

                    <textarea
                        placeholder="Combo Description"
                        value={comboDescription}
                        onChange={(e) =>
                            setComboDescription(
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="combo-builder-sections">
                    {categories
                        .filter(
                            cat =>
                                cat.name !== 'Combos'
                        )
                        .map(category => {
                            const categoryItems =
                                items.filter(
                                    item =>
                                        item.category ===
                                        category.name
                                );

                            if (
                                categoryItems.length === 0
                            )
                                return null;

                            return (
                                <div
                                    key={category.id}
                                    className="combo-category-block"
                                >
                                    <h3>{category.name}</h3>

                                    <div className="combo-items-scroll">
                                        {categoryItems.map(
                                            item => (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className={`combo-select-card premium ${selectedItems.find(
                                                        selected =>
                                                            selected.id ===
                                                            item.id
                                                    )
                                                        ? 'selected'
                                                        : ''
                                                        }`}
                                                    onClick={() =>
                                                        toggleItem(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            item.imageUrl
                                                        }
                                                        alt={
                                                            item.name
                                                        }
                                                    />

                                                    <div>
                                                        <h4>
                                                            {
                                                                item.name
                                                            }
                                                        </h4>
                                                        <p>
                                                            ₹
                                                            {
                                                                item.price
                                                            }
                                                        </p>
                                                    </div>

                                                    <Plus size={18} />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <div className="combo-preview-panel premium-preview">
                    <h3>Selected Combo Items</h3>

                    <div className="selected-combo-grid">
                        {selectedItems.map(item => (
                            <div
                                key={item.id}
                                className="selected-combo-card"
                            >
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                />
                                <span>{item.name}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="save-combo-btn premium-save"
                        onClick={saveCombo}
                    >
                        Save Premium Combo
                    </button>
                </div>
            </div>
        </div>
    );
}