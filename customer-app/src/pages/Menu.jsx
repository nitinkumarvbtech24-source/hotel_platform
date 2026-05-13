import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const MENU_DATA = {
    hotel1: [
        { id: 1, name: 'Burger', price: 10 },
        { id: 2, name: 'Pizza', price: 15 }
    ],
    hotel2: [
        { id: 3, name: 'Pasta', price: 12 }
    ]
};

export default function Menu() {
    const { hotelId } = useParams();
    const { addToCart } = useCart();

    const menuItems = MENU_DATA[hotelId] || [];

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Menu</h1>

            {menuItems.map(item => (
                <div key={item.id} className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <h3>{item.name}</h3>
                    <p>${item.price}</p>
                    <button className="btn btn-primary" onClick={() => addToCart(item)}>
                        Add To Cart
                    </button>
                </div>
            ))}
        </div>
    );
}