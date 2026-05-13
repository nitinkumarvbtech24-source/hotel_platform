import { Search, X, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function QuickMenuDrawer({
    isOpen,
    onClose,
    items,
    onAddItem
}) {
    const [search, setSearch] = useState('');

    const groupedItems = useMemo(() => {
        const filtered = items.filter(item =>
            item.name
                ?.toLowerCase()
                .includes(search.toLowerCase())
        );

        return filtered.reduce((acc, item) => {
            const category = item.category || 'Others';

            if (!acc[category]) acc[category] = [];

            acc[category].push(item);
            return acc;
        }, {});
    }, [items, search]);

    return (
        <div
            className={`quick-menu-overlay ${isOpen ? 'open' : ''
                }`}
        >
            <div className="quick-menu-drawer">
                <div className="quick-menu-header">
                    <div>
                        <h2>Quick Menu</h2>
                        <p>
                            Quickly add dishes to current bill
                        </p>
                    </div>

                    <button
                        className="drawer-close-btn"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="quick-menu-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                <div className="quick-menu-content">
                    {Object.keys(groupedItems).map(
                        category => (
                            <div
                                key={category}
                                className="quick-category-block"
                            >
                                <div className="quick-category-header">
                                    <h3>{category}</h3>
                                    <span>
                                        {
                                            groupedItems[
                                                category
                                            ].length
                                        }{' '}
                                        Items
                                    </span>
                                </div>

                                <div className="quick-items-grid">
                                    {groupedItems[
                                        category
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            className="quick-food-btn"
                                            onClick={() =>
                                                onAddItem(
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
                                                <span>
                                                    ₹
                                                    {
                                                        item.price
                                                    }
                                                </span>
                                            </div>

                                            <Plus
                                                size={
                                                    16
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}