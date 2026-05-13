import { useEffect, useState } from 'react';
import {
  collection,
  getDocs
} from 'firebase/firestore';

import { db } from '../firebase';
import "../styles/customerDashboard.css";

import CustomerSidebar from '../components/CustomerSidebar';
import HotelSelector from '../components/HotelSelector';
import { useCart } from '../context/CartContext';

export default function CustomerDashboard() {

  const [selectedHotel, setSelectedHotel] =
    useState(null);

  const [menuItems, setMenuItems] =
    useState([]);

  const { addToCart } = useCart();

  const user = {
    name:
      localStorage.getItem('customerName')
      || 'Customer',

    email:
      localStorage.getItem('customerEmail')
      || 'No Email'
  };

  useEffect(() => {

    const fetchMenu = async () => {

      if (!selectedHotel) {
        setMenuItems([]);
        return;
      }

      try {

        const snap = await getDocs(
          collection(
            db,
            'hotels',
            selectedHotel.id,
            'menu'
          )
        );

        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMenuItems(data);

      } catch (err) {

        console.error(
          'Error fetching menu:',
          err
        );
      }
    };

    fetchMenu();

  }, [selectedHotel]);

  return (

    <div className="customer-dashboard-layout">

      <CustomerSidebar
        activePage="Dashboard"
        user={user}
      />

      <main className="customer-dashboard-main">

        <header className="customer-header">

          <div>

            <h1>
              Welcome Back,
              {` ${user.name}`}
            </h1>

            <p>
              Browse menus and order instantly
            </p>

          </div>

        </header>

        <HotelSelector
          selectedHotel={selectedHotel}
          setSelectedHotel={setSelectedHotel}
        />

        {selectedHotel && (

          <div className="selected-hotel-banner">

            <h2>
              {selectedHotel.hotelName}
            </h2>

            <p>
              {selectedHotel.location}
            </p>

          </div>
        )}

        <div className="customer-menu-grid">

          {menuItems.length > 0 ? (

            menuItems.map((item, index) => (

              <div
                key={`${item.id}-${index}`}
                className="customer-menu-card"
              >

                <img
                  src={
                    item.imageUrl ||
                    'https://via.placeholder.com/400x250?text=Food'
                  }
                  alt={item.name}
                />

                <div className="menu-card-content">

                  <h3>{item.name}</h3>

                  <p>
                    {item.description ||
                      'Delicious food item'}
                  </p>

                  <div className="menu-card-footer">

                    <span>
                      ₹{item.price}
                    </span>

                    <button
                      onClick={() =>
                        addToCart({
                          ...item,
                          hotelId:
                            selectedHotel.id,

                          hotelName:
                            selectedHotel.hotelName,
                          
                          hotelLocation:
                            selectedHotel.location
                        })
                      }
                    >
                      Add
                    </button>

                  </div>

                </div>

              </div>

            ))

          ) : (

            <div className="menu-empty-state">

              {selectedHotel
                ? 'No menu items available for this hotel.'
                : 'Select a hotel to view menu.'}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}