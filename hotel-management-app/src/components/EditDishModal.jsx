import { useEffect, useState } from 'react';
import {
    doc,
    updateDoc
} from 'firebase/firestore';
import { X } from 'lucide-react';
import { db } from '../firebase';

export default function EditDishModal({
    isOpen,
    onClose,
    hotelId,
    item,
    categories,
    refreshData
}) {
    const [form, setForm] = useState({
        name: '',
        price: '',
        category: '',
        imageUrl: '',
        description: ''
    });

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name || '',
                price: item.price || '',
                category: item.category || '',
                imageUrl: item.imageUrl || '',
                description: item.description || ''
            });
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const saveChanges = async () => {
        await updateDoc(
            doc(
                db,
                'hotels',
                hotelId,
                'menu',
                item.id
            ),
            form
        );

        refreshData();
        onClose();
    };

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal">
                <div className="edit-modal-header">
                    <h2>Edit Dish</h2>

                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="edit-form-grid">
                    <input
                        value={form.name}
                        placeholder="Dish Name"
                        onChange={(e) =>
                            setForm({
                                ...form,
                                name: e.target.value
                            })
                        }
                    />

                    <input
                        value={form.price}
                        placeholder="Price"
                        onChange={(e) =>
                            setForm({
                                ...form,
                                price: e.target.value
                            })
                        }
                    />

                    <select
                        value={form.category}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                category:
                                    e.target.value
                            })
                        }
                    >
                        {categories.map(cat => (
                            <option
                                key={cat.id}
                                value={cat.name}
                            >
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <input
                        value={form.imageUrl}
                        placeholder="Image URL"
                        onChange={(e) =>
                            setForm({
                                ...form,
                                imageUrl:
                                    e.target.value
                            })
                        }
                    />

                    <textarea
                        value={form.description}
                        placeholder="Description"
                        onChange={(e) =>
                            setForm({
                                ...form,
                                description:
                                    e.target.value
                            })
                        }
                    />

                    {form.imageUrl && (
                        <img
                            src={form.imageUrl}
                            alt="Preview"
                            className="edit-preview-img"
                        />
                    )}

                    <button
                        className="save-edit-btn"
                        onClick={saveChanges}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}