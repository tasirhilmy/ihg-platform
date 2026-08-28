import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Type-safe enum-like constants (SQLite-compatible)
const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PROPERTY_ADMIN: "PROPERTY_ADMIN",
  MANAGER: "MANAGER",
  RECEPTION: "RECEPTION",
  HOUSEKEEPING: "HOUSEKEEPING",
  KITCHEN: "KITCHEN",
  WAITER: "WAITER",
  DELIVERY: "DELIVERY",
  CUSTOMER: "CUSTOMER",
} as const;
const RoomStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  CLEANING: "CLEANING",
  MAINTENANCE: "MAINTENANCE",
  DIRTY: "DIRTY",
} as const;
const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
const OrderStatus = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
const OrderType = {
  DINE_IN: "DINE_IN",
  DELIVERY: "DELIVERY",
  ROOM_SERVICE: "ROOM_SERVICE",
} as const;
const TableStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  OCCUPIED: "OCCUPIED",
  CLEANING: "CLEANING",
} as const;
const HousekeepingStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  INSPECTED: "INSPECTED",
} as const;
const HousekeepingTaskType = {
  CHECKOUT_CLEAN: "CHECKOUT_CLEAN",
  STAY_OVER: "STAY_OVER",
  TOUCH_UP: "TOUCH_UP",
  DEEP_CLEAN: "DEEP_CLEAN",
  TURNDOWN: "TURNDOWN",
} as const;
const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SEATED: "SEATED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  BKASH: "BKASH",
  NAGAD: "NAGAD",
  ONLINE_GATEWAY: "ONLINE_GATEWAY",
  ROOM_CHARGE: "ROOM_CHARGE",
  OTHER: "OTHER",
} as const;
const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
const AlertType = {
  BOOKING_NEW: "BOOKING_NEW",
  BOOKING_CHECKIN: "BOOKING_CHECKIN",
  BOOKING_CHECKOUT: "BOOKING_CHECKOUT",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_READY: "ORDER_READY",
  DELIVERY_ASSIGNED: "DELIVERY_ASSIGNED",
  DELIVERY_DELIVERED: "DELIVERY_DELIVERED",
  SERVICE_REQUEST: "SERVICE_REQUEST",
  HOUSEKEEPING_DONE: "HOUSEKEEPING_DONE",
  INVENTORY_LOW: "INVENTORY_LOW",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  SYSTEM: "SYSTEM",
} as const;
const AlertSeverity = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
} as const;

const PASSWORD = "demo1234";

async function main() {
  console.log("🌱 Seeding IHG platform database...");

  // Clear existing data
  await db.$transaction([
    db.alert.deleteMany(),
    db.auditLog.deleteMany(),
    db.emailLog.deleteMany(),
    db.reportSnapshot.deleteMany(),
    db.payment.deleteMany(),
    db.inventoryUsage.deleteMany(),
    db.inventoryItem.deleteMany(),
    db.deliveryOrder.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.tableReservation.deleteMany(),
    db.menuItem.deleteMany(),
    db.menuCategory.deleteMany(),
    db.restaurantTable.deleteMany(),
    db.roomServiceRequest.deleteMany(),
    db.housekeepingTask.deleteMany(),
    db.booking.deleteMany(),
    db.room.deleteMany(),
    db.roomType.deleteMany(),
    db.guest.deleteMany(),
    db.user.deleteMany(),
    db.property.deleteMany(),
  ]);

  // ============================================
  //  PROPERTIES
  // ============================================
  const property1 = await db.property.create({
    data: {
      name: "IHG Dhaka Downtown",
      slug: "ihg-dhaka-downtown",
      address: "House 12, Road 7, Dhanmondi",
      city: "Dhaka",
      country: "Bangladesh",
      phone: "+880 2 9123456",
      email: "dhaka@ihg.com",
      timezone: "Asia/Dhaka",
      currency: "BDT",
      description: "Flagship property in the heart of Dhaka with 60 rooms, rooftop restaurant, and 24/7 delivery service.",
    },
  });

  const property2 = await db.property.create({
    data: {
      name: "IHG Chattogram Bay",
      slug: "ihg-chattogram-bay",
      address: "55 Agrabad Commercial Area",
      city: "Chattogram",
      country: "Bangladesh",
      phone: "+880 31 712345",
      email: "ctg@ihg.com",
      timezone: "Asia/Dhaka",
      currency: "BDT",
      description: "Coastal property with sea-view restaurant and dedicated delivery fleet.",
    },
  });

  console.log(`✓ Created ${2} properties`);

  // ============================================
  //  USERS (one per role + a few extra)
  // ============================================
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const users = await Promise.all([
    // Super admin (no property)
    db.user.create({
      data: {
        email: "admin@ihg.com",
        passwordHash: hashedPassword,
        name: "System Admin",
        role: UserRole.SUPER_ADMIN,
        phone: "+880 1700 000001",
      },
    }),
    // Property 1 staff
    db.user.create({
      data: {
        email: "manager@ihg.com",
        passwordHash: hashedPassword,
        name: "Nadia Hossain",
        role: UserRole.MANAGER,
        propertyId: property1.id,
        phone: "+880 1700 000010",
      },
    }),
    db.user.create({
      data: {
        email: "reception@ihg.com",
        passwordHash: hashedPassword,
        name: "Sabbir Ahmed",
        role: UserRole.RECEPTION,
        propertyId: property1.id,
        phone: "+880 1700 000011",
      },
    }),
    db.user.create({
      data: {
        email: "housekeeping@ihg.com",
        passwordHash: hashedPassword,
        name: "Rina Akter",
        role: UserRole.HOUSEKEEPING,
        propertyId: property1.id,
        phone: "+880 1700 000012",
      },
    }),
    db.user.create({
      data: {
        email: "kitchen@ihg.com",
        passwordHash: hashedPassword,
        name: "Chef Karim",
        role: UserRole.KITCHEN,
        propertyId: property1.id,
        phone: "+880 1700 000013",
      },
    }),
    db.user.create({
      data: {
        email: "waiter@ihg.com",
        passwordHash: hashedPassword,
        name: "Tania Rahman",
        role: UserRole.WAITER,
        propertyId: property1.id,
        phone: "+880 1700 000014",
      },
    }),
    db.user.create({
      data: {
        email: "delivery@ihg.com",
        passwordHash: hashedPassword,
        name: "Faruq Islam",
        role: UserRole.DELIVERY,
        propertyId: property1.id,
        phone: "+880 1700 000015",
      },
    }),
    // Property 1 property admin
    db.user.create({
      data: {
        email: "owner.dhaka@ihg.com",
        passwordHash: hashedPassword,
        name: "Mahmud Khan",
        role: UserRole.PROPERTY_ADMIN,
        propertyId: property1.id,
        phone: "+880 1700 000020",
      },
    }),
    // Property 2 manager
    db.user.create({
      data: {
        email: "manager.ctg@ihg.com",
        passwordHash: hashedPassword,
        name: "Sumaiya Akter",
        role: UserRole.MANAGER,
        propertyId: property2.id,
        phone: "+880 1700 000030",
      },
    }),
  ]);

  // Customer user (no property for now, but Customer doesn't need one)
  const customerUser = await db.user.create({
    data: {
      email: "customer@example.com",
      passwordHash: hashedPassword,
      name: "Imran Hossain",
      role: UserRole.CUSTOMER,
      phone: "+880 1711 223344",
    },
  });

  console.log(`✓ Created ${users.length + 1} users`);

  // Guest profile for customer user
  const guest = await db.guest.create({
    data: {
      userId: customerUser.id,
      propertyId: property1.id,
      idType: "NID",
      idNumber: "199012345678",
      address: "House 5, Road 12, Banani",
      city: "Dhaka",
      country: "Bangladesh",
      vipStatus: false,
      loyaltyPoints: 250,
    },
  });

  // ============================================
  //  ROOM TYPES + ROOMS (Property 1)
  // ============================================
  const standardType = await db.roomType.create({
    data: {
      propertyId: property1.id,
      name: "Standard",
      description: "Comfortable room with city view, queen bed, free WiFi.",
      basePrice: 3500,
      capacity: 2,
      amenities: "WiFi, AC, TV, Mini Fridge",
      isActive: true,
    },
  });

  const deluxeType = await db.roomType.create({
    data: {
      propertyId: property1.id,
      name: "Deluxe",
      description: "Spacious deluxe room with balcony, king bed, and premium amenities.",
      basePrice: 5500,
      capacity: 3,
      amenities: "WiFi, AC, Smart TV, Mini Bar, Balcony, Bathtub",
      isActive: true,
    },
  });

  const suiteType = await db.roomType.create({
    data: {
      propertyId: property1.id,
      name: "Executive Suite",
      description: "Luxury suite with separate living area, premium toiletries, and complimentary breakfast.",
      basePrice: 9500,
      capacity: 4,
      amenities: "WiFi, AC, Smart TV, Mini Bar, Balcony, Bathtub, Living Room, Breakfast",
      isActive: true,
    },
  });

  // Create rooms (3 floors × 10 rooms = 30, mix of types)
  const roomData: Array<{ number: string; type: string; floor: number; status: string }> = [];
  // Floor 1-2: Standard
  for (let f = 1; f <= 2; f++) {
    for (let i = 1; i <= 8; i++) {
      roomData.push({
        number: `${f}${String(i).padStart(2, "0")}`,
        type: "standard",
        floor: f,
        status: i % 5 === 0 ? RoomStatus.DIRTY : i % 4 === 0 ? RoomStatus.OCCUPIED : RoomStatus.AVAILABLE,
      });
    }
  }
  // Floor 3: Deluxe
  for (let i = 1; i <= 8; i++) {
    roomData.push({
      number: `30${i}`,
      type: "deluxe",
      floor: 3,
      status: i % 3 === 0 ? RoomStatus.OCCUPIED : RoomStatus.AVAILABLE,
    });
  }
  // Floor 4: Suite
  for (let i = 1; i <= 4; i++) {
    roomData.push({
      number: `40${i}`,
      type: "suite",
      floor: 4,
      status: i === 1 ? RoomStatus.OCCUPIED : RoomStatus.AVAILABLE,
    });
  }

  const typeMap = { standard: standardType.id, deluxe: deluxeType.id, suite: suiteType.id };

  for (const r of roomData) {
    await db.room.create({
      data: {
        propertyId: property1.id,
        roomNumber: r.number,
        roomTypeId: typeMap[r.type as keyof typeof typeMap],
        floor: r.floor,
        status: r.status,
      },
    });
  }
  console.log(`✓ Created ${roomData.length} rooms in 3 types`);

  // Same for property2 (simplified)
  const standardType2 = await db.roomType.create({
    data: { propertyId: property2.id, name: "Standard", basePrice: 3800, capacity: 2 },
  });
  const deluxeType2 = await db.roomType.create({
    data: { propertyId: property2.id, name: "Deluxe Sea View", basePrice: 6500, capacity: 3 },
  });
  for (let f = 1; f <= 3; f++) {
    for (let i = 1; i <= 6; i++) {
      await db.room.create({
        data: {
          propertyId: property2.id,
          roomNumber: `${f}${String(i).padStart(2, "0")}`,
          roomTypeId: i <= 3 ? standardType2.id : deluxeType2.id,
          floor: f,
          status: i % 4 === 0 ? RoomStatus.OCCUPIED : RoomStatus.AVAILABLE,
        },
      });
    }
  }
  console.log(`✓ Created rooms in property 2`);

  // ============================================
  //  BOOKINGS
  // ============================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 3);

  const occupiedRooms = await db.room.findMany({
    where: { propertyId: property1.id, status: RoomStatus.OCCUPIED },
  });

  // Create a booking for each currently occupied room (they checked in yesterday)
  for (let i = 0; i < Math.min(occupiedRooms.length, 4); i++) {
    const room = occupiedRooms[i];
    await db.booking.create({
      data: {
        propertyId: property1.id,
        bookingCode: `BK-${new Date().getFullYear()}-${String(1001 + i).padStart(4, "0")}`,
        guestId: guest.id,
        roomTypeId: room.roomTypeId,
        roomId: room.id,
        checkInDate: yesterday,
        checkOutDate: tomorrow,
        actualCheckIn: yesterday,
        adults: 1 + (i % 2),
        children: i % 3 === 0 ? 1 : 0,
        status: BookingStatus.CHECKED_IN,
        totalAmount: 5500,
        paidAmount: 5500,
        taxAmount: 250,
      },
    });
  }

  // Upcoming booking for tomorrow
  const availRoom = await db.room.findFirst({
    where: { propertyId: property1.id, status: RoomStatus.AVAILABLE },
  });
  if (availRoom) {
    await db.booking.create({
      data: {
        propertyId: property1.id,
        bookingCode: `BK-${new Date().getFullYear()}-1099`,
        guestId: guest.id,
        roomTypeId: availRoom.roomTypeId,
        checkInDate: tomorrow,
        checkOutDate: dayAfter,
        adults: 2,
        children: 0,
        status: BookingStatus.CONFIRMED,
        totalAmount: 7000,
        paidAmount: 3500,
        taxAmount: 350,
      },
    });
  }

  console.log("✓ Created bookings");

  // ============================================
  //  HOUSEKEEPING TASKS
  // ============================================
  const dirtyRooms = await db.room.findMany({
    where: { propertyId: property1.id, status: RoomStatus.DIRTY },
    take: 5,
  });
  for (const room of dirtyRooms) {
    await db.housekeepingTask.create({
      data: {
        propertyId: property1.id,
        roomId: room.id,
        assigneeId: users.find((u) => u.role === UserRole.HOUSEKEEPING)?.id,
        taskType: HousekeepingTaskType.CHECKOUT_CLEAN,
        status: HousekeepingStatus.PENDING,
        scheduledFor: new Date(),
      },
    });
  }
  console.log(`✓ Created ${dirtyRooms.length} housekeeping tasks`);

  // ============================================
  //  RESTAURANT TABLES
  // ============================================
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    const t = await db.restaurantTable.create({
      data: {
        propertyId: property1.id,
        tableNumber: `T${String(i).padStart(2, "0")}`,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        section: i <= 6 ? "Indoor" : "Outdoor",
        status: i === 1 ? TableStatus.OCCUPIED : i === 5 ? TableStatus.RESERVED : TableStatus.AVAILABLE,
        posX: (i - 1) % 4,
        posY: Math.floor((i - 1) / 4),
      },
    });
    tables.push(t);
  }
  console.log(`✓ Created ${tables.length} restaurant tables`);

  // ============================================
  //  MENU
  // ============================================
  const categories = await Promise.all([
    db.menuCategory.create({
      data: { propertyId: property1.id, name: "Appetizers", displayOrder: 1, description: "Start your meal right" },
    }),
    db.menuCategory.create({
      data: { propertyId: property1.id, name: "Main Course", displayOrder: 2, description: "Chef's signature dishes" },
    }),
    db.menuCategory.create({
      data: { propertyId: property1.id, name: "Biryani & Rice", displayOrder: 3, description: "Fragrant rice dishes" },
    }),
    db.menuCategory.create({
      data: { propertyId: property1.id, name: "Beverages", displayOrder: 4, description: "Hot & cold drinks" },
    }),
    db.menuCategory.create({
      data: { propertyId: property1.id, name: "Desserts", displayOrder: 5, description: "Sweet endings" },
    }),
  ]);

  const menuItemsData = [
    { cat: 0, name: "Spring Rolls (4 pcs)", price: 280, isVeg: true, prep: 10, desc: "Crispy vegetable rolls with sweet chili sauce" },
    { cat: 0, name: "Chicken Satay", price: 380, isVeg: false, prep: 12, desc: "Grilled chicken skewers with peanut sauce" },
    { cat: 0, name: "Samosa (2 pcs)", price: 180, isVeg: true, prep: 8, desc: "Crispy pastry with spiced potato filling" },

    { cat: 1, name: "Grilled Chicken Steak", price: 850, isVeg: false, prep: 25, desc: "Tender chicken breast with herb butter, seasonal veggies" },
    { cat: 1, name: "Paneer Butter Masala", price: 620, isVeg: true, prep: 20, desc: "Cottage cheese in rich tomato-cashew gravy" },
    { cat: 1, name: "Beef Steak", price: 1450, isVeg: false, prep: 30, desc: "Premium beef with mashed potatoes and red wine jus" },
    { cat: 1, name: "Fish & Chips", price: 780, isVeg: false, prep: 22, desc: "Battered fish with fries and tartar sauce" },
    { cat: 1, name: "Vegetable Pasta", price: 580, isVeg: true, prep: 18, desc: "Penne in creamy tomato basil sauce" },

    { cat: 2, name: "Chicken Biryani", price: 480, isVeg: false, prep: 25, desc: "Fragrant basmati rice with tender chicken" },
    { cat: 2, name: "Mutton Biryani", price: 680, isVeg: false, prep: 30, desc: "Slow-cooked mutton in aromatic spices" },
    { cat: 2, name: "Vegetable Biryani", price: 380, isVeg: true, prep: 20, desc: "Mixed vegetables in saffron rice" },
    { cat: 2, name: "Kacchi Biryani", price: 580, isVeg: false, prep: 35, desc: "Traditional Dhaka-style mutton kacchi" },

    { cat: 3, name: "Mineral Water", price: 40, isVeg: true, prep: 1, desc: "500ml bottle" },
    { cat: 3, name: "Soft Drink (Coke/Sprite)", price: 80, isVeg: true, prep: 1, desc: "Chilled 330ml can" },
    { cat: 3, name: "Fresh Lime Soda", price: 120, isVeg: true, prep: 3, desc: "Sweet, salty, or mixed" },
    { cat: 3, name: "Mango Lassi", price: 180, isVeg: true, prep: 4, desc: "Creamy yogurt drink with mango pulp" },
    { cat: 3, name: "Masala Chai", price: 80, isVeg: true, prep: 5, desc: "Traditional spiced tea" },
    { cat: 3, name: "Cappuccino", price: 220, isVeg: true, prep: 5, desc: "Italian-style coffee" },

    { cat: 4, name: "Gulab Jamun (2 pcs)", price: 160, isVeg: true, prep: 5, desc: "Soft milk dumplings in sugar syrup" },
    { cat: 4, name: "Ice Cream (2 scoops)", price: 240, isVeg: true, prep: 3, desc: "Vanilla, chocolate, or strawberry" },
    { cat: 4, name: "Firni", price: 180, isVeg: true, prep: 5, desc: "Traditional rice pudding" },
  ];

  const menuItems = [];
  for (const item of menuItemsData) {
    const mi = await db.menuItem.create({
      data: {
        propertyId: property1.id,
        categoryId: categories[item.cat].id,
        name: item.name,
        price: item.price,
        description: item.desc,
        isVeg: item.isVeg,
        prepTimeMins: item.prep,
        isAvailable: true,
      },
    });
    menuItems.push(mi);
  }
  console.log(`✓ Created ${menuItems.length} menu items in ${categories.length} categories`);

  // ============================================
  //  SAMPLE ORDERS (mix of dine-in, delivery, room service)
  // ============================================
  const occupiedTable = tables.find((t) => t.status === TableStatus.OCCUPIED);

  // Active dine-in order
  if (occupiedTable) {
    const items1 = menuItems.slice(8, 11); // biryani items
    const order1 = await db.order.create({
      data: {
        propertyId: property1.id,
        orderNumber: `ORD-${new Date().getFullYear()}-1001`,
        orderType: OrderType.DINE_IN,
        tableId: occupiedTable.id,
        waiterId: users.find((u) => u.role === UserRole.WAITER)?.id,
        customerName: "Walk-in Guest",
        customerPhone: "+880 1700 999999",
        status: OrderStatus.PREPARING,
        subtotal: items1.reduce((sum, i) => sum + Number(i.price), 0),
        taxAmount: 50,
        totalAmount: items1.reduce((sum, i) => sum + Number(i.price), 0) + 50,
        items: {
          create: items1.map((mi) => ({
            menuItemId: mi.id,
            quantity: 1,
            unitPrice: mi.price,
          })),
        },
      },
    });
  }

  // Delivery order (in-progress)
  const deliveryOrder1 = await db.order.create({
    data: {
      propertyId: property1.id,
      orderNumber: `ORD-${new Date().getFullYear()}-1002`,
      orderType: OrderType.DELIVERY,
      customerName: customerUser.name,
      customerPhone: customerUser.phone ?? "+880 1711 223344",
      customerEmail: customerUser.email,
      status: OrderStatus.OUT_FOR_DELIVERY,
      subtotal: 960,
      taxAmount: 48,
      totalAmount: 1058,
      items: {
        create: [
          { menuItemId: menuItems[8].id, quantity: 2, unitPrice: menuItems[8].price }, // 2x Chicken Biryani
        ],
      },
      deliveryOrder: {
        create: {
          propertyId: property1.id,
          customerId: customerUser.id,
          agentId: users.find((u) => u.role === UserRole.DELIVERY)?.id,
          deliveryAddress: "House 5, Road 12, Banani, Dhaka 1213",
          deliveryCity: "Dhaka",
          deliveryPhone: customerUser.phone ?? "+880 1711 223344",
          pickedUpAt: new Date(Date.now() - 15 * 60 * 1000),
          estimatedTime: 25,
          deliveryFee: 50,
        },
      },
    },
  });

  // Placed order (just received, needs to be confirmed)
  await db.order.create({
    data: {
      propertyId: property1.id,
      orderNumber: `ORD-${new Date().getFullYear()}-1003`,
      orderType: OrderType.DELIVERY,
      customerName: "Asif Mahmud",
      customerPhone: "+880 1722 334455",
      status: OrderStatus.PLACED,
      subtotal: 580,
      taxAmount: 29,
      totalAmount: 659,
      items: {
        create: [
          { menuItemId: menuItems[5].id, quantity: 1, unitPrice: menuItems[5].price }, // Beef Steak
          { menuItemId: menuItems[15].id, quantity: 1, unitPrice: menuItems[15].price }, // Mango Lassi
        ],
      },
      deliveryOrder: {
        create: {
          propertyId: property1.id,
          deliveryAddress: "House 22, Road 11, Gulshan 2",
          deliveryCity: "Dhaka",
          deliveryPhone: "+880 1722 334455",
          estimatedTime: 35,
          deliveryFee: 50,
        },
      },
    },
  });

  // Completed order (yesterday)
  await db.order.create({
    data: {
      propertyId: property1.id,
      orderNumber: `ORD-${new Date().getFullYear()}-0999`,
      orderType: OrderType.DINE_IN,
      tableId: tables[0].id,
      customerName: "Walk-in",
      customerPhone: "—",
      status: OrderStatus.COMPLETED,
      subtotal: 1320,
      taxAmount: 66,
      totalAmount: 1386,
      placedAt: yesterday,
      completedAt: yesterday,
      items: {
        create: [
          { menuItemId: menuItems[5].id, quantity: 1, unitPrice: menuItems[5].price },
          { menuItemId: menuItems[15].id, quantity: 2, unitPrice: menuItems[15].price },
        ],
      },
    },
  });

  console.log("✓ Created 4 sample orders (1 dine-in active, 2 delivery, 1 completed)");

  // ============================================
  //  TABLE RESERVATIONS
  // ============================================
  await db.tableReservation.create({
    data: {
      propertyId: property1.id,
      tableId: tables.find((t) => t.tableNumber === "T05")!.id,
      guestName: "Salma Begum",
      guestPhone: "+880 1733 445566",
      guestEmail: "salma@example.com",
      partySize: 4,
      reservedAt: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 7pm today
      durationMins: 90,
      status: ReservationStatus.CONFIRMED,
      notes: "Anniversary celebration",
    },
  });

  await db.tableReservation.create({
    data: {
      propertyId: property1.id,
      tableId: tables.find((t) => t.tableNumber === "T02")!.id,
      guestName: customerUser.name,
      guestPhone: customerUser.phone ?? "+880 1711 223344",
      userId: customerUser.id,
      partySize: 2,
      reservedAt: new Date(tomorrow.getTime() + 20 * 60 * 60 * 1000), // 8pm tomorrow
      durationMins: 120,
      status: ReservationStatus.CONFIRMED,
    },
  });
  console.log("✓ Created 2 reservations");

  // ============================================
  //  INVENTORY
  // ============================================
  const inventoryData = [
    { name: "Basmati Rice", sku: "RICE-BAS-5", unit: "kg", qty: 50, min: 20, cost: 120, cat: "Food" },
    { name: "Chicken Breast", sku: "MEAT-CHK", unit: "kg", qty: 25, min: 15, cost: 280, cat: "Food" },
    { name: "Mutton", sku: "MEAT-MUT", unit: "kg", qty: 12, min: 10, cost: 850, cat: "Food" },
    { name: "Beef Tenderloin", sku: "MEAT-BEEF", unit: "kg", qty: 8, min: 5, cost: 1500, cat: "Food" },
    { name: "Paneer", sku: "DAI-PAN", unit: "kg", qty: 6, min: 8, cost: 350, cat: "Food" }, // low
    { name: "Cooking Oil", sku: "OIL-SOY-5", unit: "L", qty: 30, min: 15, cost: 220, cat: "Food" },
    { name: "Onion", sku: "VEG-ONI", unit: "kg", qty: 40, min: 20, cost: 60, cat: "Food" },
    { name: "Tomato", sku: "VEG-TOM", unit: "kg", qty: 15, min: 20, cost: 80, cat: "Food" }, // low
    { name: "Yogurt", sku: "DAI-YOG", unit: "kg", qty: 18, min: 10, cost: 150, cat: "Food" },
    { name: "Coffee Beans", sku: "BEV-COF", unit: "kg", qty: 4, min: 2, cost: 2200, cat: "Beverage" },
    { name: "Tea Leaves", sku: "BEV-TEA", unit: "kg", qty: 5, min: 2, cost: 800, cat: "Beverage" },
    { name: "Toilet Paper (roll)", sku: "AMEN-TP", unit: "pcs", qty: 200, min: 100, cost: 35, cat: "Amenity" },
    { name: "Shampoo (small bottle)", sku: "AMEN-SHMP", unit: "pcs", qty: 80, min: 50, cost: 45, cat: "Amenity" },
    { name: "Hand Soap", sku: "AMEN-SOAP", unit: "pcs", qty: 60, min: 80, cost: 30, cat: "Amenity" }, // low
    { name: "Cleaning Solution", sku: "CLN-SOL", unit: "L", qty: 25, min: 10, cost: 180, cat: "Cleaning" },
  ];

  for (const inv of inventoryData) {
    await db.inventoryItem.create({
      data: {
        propertyId: property1.id,
        name: inv.name,
        sku: inv.sku,
        unit: inv.unit,
        quantity: inv.qty,
        minQuantity: inv.min,
        unitCost: inv.cost,
        category: inv.cat,
      },
    });
  }
  console.log(`✓ Created ${inventoryData.length} inventory items`);

  // ============================================
  //  ALERTS
  // ============================================
  await db.alert.create({
    data: {
      propertyId: property1.id,
      type: AlertType.ORDER_PLACED,
      severity: AlertSeverity.INFO,
      title: "New delivery order ORD-2026-1003",
      message: "Asif Mahmud placed a delivery order — ৳659",
      entityType: "order",
    },
  });
  await db.alert.create({
    data: {
      propertyId: property1.id,
      type: AlertType.DELIVERY_ASSIGNED,
      severity: AlertSeverity.SUCCESS,
      title: "Delivery assigned",
      message: "Faruq Islam picked up order ORD-2026-1002 — Banani",
      entityType: "order",
    },
  });
  await db.alert.create({
    data: {
      propertyId: property1.id,
      type: AlertType.INVENTORY_LOW,
      severity: AlertSeverity.WARNING,
      title: "Low inventory: Paneer",
      message: "Paneer stock is 6 kg, below the 8 kg minimum. Reorder needed.",
      entityType: "inventory",
    },
  });
  await db.alert.create({
    data: {
      propertyId: property1.id,
      type: AlertType.SERVICE_REQUEST,
      severity: AlertSeverity.WARNING,
      title: "Service request: Extra towels",
      message: "Room 201 requested extra towels — pending assignment",
      entityType: "serviceRequest",
    },
  });
  await db.alert.create({
    data: {
      propertyId: property1.id,
      type: AlertType.BOOKING_NEW,
      severity: AlertSeverity.INFO,
      title: "New booking BK-2026-1099",
      message: "Imran Hossain — Deluxe, 2 nights, checking in tomorrow",
      entityType: "booking",
    },
  });

  console.log("✓ Created 5 sample alerts");

  // ============================================
  //  SAMPLE PAYMENTS
  // ============================================
  const someBooking = await db.booking.findFirst({
    where: { propertyId: property1.id, status: BookingStatus.CHECKED_IN },
  });
  if (someBooking) {
    await db.payment.create({
      data: {
        propertyId: property1.id,
        reference: `PAY-${new Date().getFullYear()}-1001`,
        bookingId: someBooking.id,
        amount: someBooking.totalAmount,
        method: PaymentMethod.CARD,
        status: PaymentStatus.COMPLETED,
        paidAt: yesterday,
        transactionId: "MOCK_TXN_001",
      },
    });
  }

  console.log("✓ Created sample payments");
  console.log("\n🎉 Seed complete!\n");
  console.log("Login credentials (all use password: demo1234):");
  console.log("  Super Admin:  admin@ihg.com");
  console.log("  Manager:      manager@ihg.com");
  console.log("  Reception:    reception@ihg.com");
  console.log("  Housekeeping: housekeeping@ihg.com");
  console.log("  Kitchen:      kitchen@ihg.com");
  console.log("  Waiter:       waiter@ihg.com");
  console.log("  Delivery:     delivery@ihg.com");
  console.log("  Customer:     customer@example.com");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
