# IHG Platform — User Manual

> A simple, step-by-step guide for hotel, restaurant, and delivery staff.
> **No technical knowledge required.**

---

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Hotel staff guide](#2-hotel-staff-guide)
3. [Restaurant staff guide](#3-restaurant-staff-guide)
4. [Kitchen staff guide](#4-kitchen-staff-guide)
5. [Delivery agent guide](#5-delivery-agent-guide)
6. [Manager guide](#6-manager-guide)
7. [Common questions](#7-common-questions)

---

## 1. Getting started

### Signing in

1. Open your web browser and go to `http://localhost:3000` (or your company's URL)
2. Click **"Sign in"** in the top-right corner
3. Enter your **email** and **password**
4. Click the **"Sign in"** button
5. You'll be taken to your dashboard

### Signing out

1. Click your **profile picture** (top-right corner)
2. Click **"Sign out"**

### What you see on screen

After signing in, you'll see:

- **Left sidebar** — main navigation. Only shows menu items you have permission to use.
- **Top bar** — your name, role, notifications bell.
- **Main area** — the page you're currently viewing.

If you ever get stuck, look for these icons:

| Icon | Meaning |
|---|---|
| 🔔 Bell | Notifications and alerts |
| ➕ Plus | Add / create new |
| ✏️ Pencil | Edit |
| 🗑️ Trash | Delete |
| ✓ Check | Confirm / mark done |
| ❌ X | Cancel / close |

---

## 2. Hotel staff guide

> For: **Reception**, **Housekeeping**, **Manager**

### 2.1 Making a new booking (Reception)

A guest calls, walks in, or emails to book a room. Here's how to create a booking:

1. From the sidebar, click **"Bookings"**
2. Click the **"New booking"** button (top-right)
3. **Guest information** section:
   - Type the guest's full name
   - Type their email
   - Type their phone number
   - (Optional) ID type and ID number
4. **Stay details** section:
   - Pick the **room type** (Standard / Deluxe / Suite)
   - Pick the **check-in** date
   - Pick the **check-out** date
   - Type the number of **adults** and **children**
5. (Optional) Add **special requests** like "high floor" or "late check-in"
6. Check the **summary** at the bottom — it shows the total price
7. Click **"Confirm booking"**

A confirmation email is sent to the guest automatically. Their booking shows up on the Bookings list.

### 2.2 Checking a guest in

1. Go to **"Bookings"**
2. Find the booking (you can search by name or booking code)
3. Click **"View"** on the right
4. Click the green **"Check in"** button (top-right)
5. Pick which **room** they're going to (only available rooms are listed)
6. Click **"Confirm check-in"**

The room is now marked as **Occupied** automatically.

### 2.3 Checking a guest out

1. Go to **"Bookings"**
2. Find the booking
3. Click **"View"**
4. Click the green **"Check out"** button
5. Confirm

The system will:
- Mark the booking as **Checked out**
- Mark the room as **Dirty** (needs cleaning)
- Automatically create a **housekeeping task** for the room

### 2.4 Managing housekeeping (Housekeeping staff)

1. From the sidebar, click **"Housekeeping"**
2. You'll see three columns: **Pending**, **In progress**, **Completed**
3. Each task card shows:
   - Room number
   - What needs to be done (e.g., "Checkout clean")
   - Priority (NORMAL / HIGH / URGENT)
   - Time scheduled
4. To start a task:
   - Click the **"Start"** button on the task
5. To complete a task:
   - Click **"Complete"** when finished
6. You can also **assign** a task to yourself or a colleague using the dropdown

When you complete a checkout-clean task, the room is automatically marked as **Available** again.

### 2.5 Viewing all rooms

1. Go to **"Hotel"** from the sidebar
2. You'll see a **color-coded grid** of all rooms:
   - **Green** = Available
   - **Blue** = Occupied
   - **Yellow** = Dirty / Reserved
   - **Red** = Maintenance

Click any room to see its full history and details.

---

## 3. Restaurant staff guide

> For: **Waiter**, **Manager**

### 3.1 Taking a new order (POS)

1. From the sidebar, click **"Restaurant"** → **"New order"**
2. **Choose order type**:
   - **Dine-in** — for guests at a table
   - **Delivery** — for orders to be delivered
   - **Room service** — for hotel guests in their room
3. **Pick a table** (for dine-in only)
4. **Add items**:
   - Click category tabs (Appetizers, Main Course, etc.)
   - Click menu items to add them to the cart
   - Use the search box to find specific items
   - Adjust quantity with **+ / −** buttons
5. **Enter customer info**:
   - Name and phone (required)
   - Email (optional, for notifications)
   - For delivery: also enter the **delivery address**
6. Add **notes** for the kitchen (e.g., "no onions", "extra spicy")
7. Click **"Place order"**

The order is sent to the kitchen display automatically.

### 3.2 Managing tables

1. Go to **"Restaurant"** from the sidebar
2. You'll see all tables with their current status:
   - 🟢 Green = Available
   - 🟡 Yellow = Reserved
   - 🔵 Blue = Occupied
3. Click any table to see its details and active orders

### 3.3 Updating the menu

1. Go to **"Restaurant"** → **"Menu"**
2. You'll see all categories and items
3. To mark an item as **available/unavailable**:
   - Toggle the switch on the right
   - When OFF, customers won't see the item
4. To add new items or categories, ask your manager (admins only)

---

## 4. Kitchen staff guide

> For: **Kitchen**, **Manager**

### 4.1 Using the Kitchen Display

1. From the sidebar, click **"Kitchen Display"**
2. You'll see orders in three columns:
   - 🟡 **New** — just received, accept to start cooking
   - 🔵 **Preparing** — being cooked
   - 🟢 **Ready** — cooked, waiting to be served
3. Each ticket shows:
   - Order number
   - Table number (for dine-in)
   - Customer name
   - All items with quantities
   - Time waiting (turns **RED** if urgent, after 20 minutes)
   - Any special notes
4. As you work:
   - Click **"Start cooking"** on a New order
   - Click **"Mark ready"** when the food is plated
   - Click **"Mark served"** when the waiter picks it up

A notification is sent to the customer automatically when the order is ready.

---

## 5. Delivery agent guide

> For: **Delivery**

### 5.1 Viewing your deliveries

1. Sign in as a delivery agent (e.g., `delivery@ihg.com`)
2. You'll be taken to **"My Deliveries"**
3. Active deliveries show at the top with:
   - Order number
   - Customer name and phone (tap to **Call**)
   - Delivery address
   - Number of items
4. Completed deliveries show below for your reference

### 5.2 Picking up an order

1. Find a **Ready** order assigned to you
2. Go to the restaurant, collect the food
3. In the app, click the green **"Picked up"** button
4. The status changes to "Out for delivery"

### 5.3 Completing a delivery

1. When you arrive at the customer's address
2. Hand over the food and collect payment (if cash)
3. In the app, click the green **"Delivered"** button
4. The order is marked complete

---

## 6. Manager guide

> For: **Manager**, **Property Admin**

### 6.1 The Dashboard

The dashboard gives you a real-time view of your property:

- **Occupancy** — how full your hotel is
- **Active orders** — restaurant + delivery + room service
- **Today's revenue** — completed payments
- **Pending requests** — service requests awaiting action
- **Today's check-ins** — guests arriving today
- **Low stock** — inventory items needing reorder
- **Recent alerts** — important events from the last few minutes

Click **"View reports"** for deeper analytics.

### 6.2 Reports

1. Go to **"Reports"** from the sidebar
2. You'll see:
   - **Daily revenue chart** (last 7 days)
   - **Top menu items** (most ordered this month)
   - **Room status snapshot**
   - **Month-to-date revenue, orders, bookings**

### 6.3 Managing users

1. Go to **"Users"** from the sidebar
2. You'll see a list of all staff with their role, property, and status
3. Counts at the top show how many users per role

> Note: Adding new users or changing roles requires a Super Admin.

### 6.4 Notifications & alerts

1. Click the **bell icon** in the top bar (or go to **"Alerts"**)
2. See all system and operational events:
   - New bookings, check-ins, check-outs
   - New orders, kitchen updates
   - Delivery assignments
   - Low stock warnings
   - Service requests
3. Click **"Mark all read"** to clear the list

---

## 7. Common questions

### Q: I forgot my password. What do I do?

Ask your manager or super admin to reset it for you. (Self-service password reset is coming soon.)

### Q: Why can't I see a menu item in the sidebar?

You don't have permission for that page. Each staff role only sees what they need. If you think you should have access, ask your manager.

### Q: I made a mistake on a booking. Can I edit it?

Some fields can be edited (e.g., special requests). For major changes (dates, room type), it's best to cancel and create a new one.

### Q: How do I know if a new order came in?

You'll hear a sound (if enabled) and see a notification in the top-right bell icon. Open it to see the details.

### Q: What happens to data when I sign out?

Nothing — your data is saved on the server. When you sign back in, everything is exactly as you left it.

### Q: Can I use this on my phone?

Yes! The platform is fully responsive. Open the same URL in your phone's browser — it'll work just like on desktop.

### Q: I'm a customer. How do I order food?

1. Go to the public site
2. Click **"Order food"** (or sign in if you have an account)
3. Browse the menu, add items to cart
4. Enter your delivery address
5. Place the order

You'll get a confirmation and can track the order in real time.

---

## Need more help?

- **Technical issues:** Contact your IT support
- **Process questions:** Ask your manager
- **Feature requests:** Talk to your super admin

---

*Last updated: August 2026 · IHG Platform v1.0*
