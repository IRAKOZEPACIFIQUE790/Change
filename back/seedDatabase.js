const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
const Admin = require('./models/Admin');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');

// Sample data arrays
const userNames = [
  'John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'David Miller',
  'Lisa Anderson', 'James Taylor', 'Jennifer Garcia', 'Robert Martinez', 'Amanda Rodriguez',
  'Christopher Lee', 'Michelle White', 'Daniel Johnson', 'Stephanie Thompson', 'Matthew Davis',
  'Nicole Wilson', 'Andrew Moore', 'Rebecca Jackson', 'Joshua Martin', 'Lauren Anderson',
  'Kevin Taylor', 'Rachel Garcia', 'Steven Martinez', 'Amber Rodriguez', 'Brian Lee',
  'Melissa White', 'Timothy Johnson', 'Heather Thompson', 'Jeffrey Davis', 'Crystal Wilson',
  'Ryan Moore', 'Tiffany Jackson', 'Gary Martin', 'Stephanie Anderson', 'Eric Taylor',
  'Monica Garcia', 'Mark Martinez', 'Angela Rodriguez', 'Scott Lee', 'Brittany White',
  'Gregory Johnson', 'Vanessa Thompson', 'Derek Davis', 'Megan Wilson', 'Travis Moore',
  'Ashley Jackson', 'Corey Martin', 'Jessica Anderson', 'Tyler Taylor', 'Samantha Garcia',
  'Brandon Martinez', 'Katherine Rodriguez', 'Adam Lee', 'Hannah White', 'Zachary Johnson',
  'Victoria Thompson', 'Cody Davis', 'Alexis Wilson', 'Dustin Moore', 'Chelsea Jackson',
  'Blake Martin', 'Morgan Anderson', 'Jordan Taylor', 'Taylor Garcia', 'Casey Martinez',
  'Riley Rodriguez', 'Avery Lee', 'Peyton White', 'Quinn Johnson', 'Skylar Thompson',
  'Rowan Davis', 'Sage Wilson', 'River Moore', 'Phoenix Jackson', 'Indigo Martin',
  'Juniper Anderson', 'Cedar Taylor', 'Aspen Garcia', 'Birch Martinez', 'Maple Rodriguez',
  'Willow Lee', 'Oak White', 'Pine Johnson', 'Elm Thompson', 'Cypress Davis',
  'Sequoia Wilson', 'Redwood Moore', 'Douglas Jackson', 'Fir Martin', 'Spruce Anderson',
  'Hemlock Taylor', 'Larch Garcia', 'Cedar Martinez', 'Yew Rodriguez', 'Juniper Lee',
  'Cypress White', 'Pine Johnson', 'Fir Thompson', 'Spruce Davis', 'Hemlock Wilson',
  'Larch Moore', 'Yew Jackson', 'Cedar Martin', 'Juniper Anderson', 'Cypress Taylor'
];

// Generate unique admin usernames
function generateAdminUsernames(count) {
  const usernames = [];
  const prefixes = ['admin', 'manager', 'supervisor', 'coordinator', 'director'];
  const names = ['john', 'emma', 'mike', 'sarah', 'david', 'lisa', 'james', 'jennifer', 'robert', 'amanda',
    'chris', 'michelle', 'daniel', 'stephanie', 'matthew', 'nicole', 'andrew', 'rebecca', 'joshua', 'lauren',
    'kevin', 'rachel', 'steven', 'amber', 'brian', 'melissa', 'timothy', 'heather', 'jeffrey', 'crystal',
    'ryan', 'tiffany', 'gary', 'eric', 'monica', 'mark', 'angela', 'scott', 'brittany', 'gregory',
    'vanessa', 'derek', 'megan', 'travis', 'ashley', 'corey', 'jessica', 'tyler', 'samantha', 'brandon',
    'adam', 'hannah', 'zachary', 'victoria', 'cody', 'alexis', 'dustin', 'chelsea', 'blake', 'morgan',
    'jordan', 'casey', 'riley', 'avery', 'peyton', 'quinn', 'skylar', 'rowan', 'sage', 'river',
    'phoenix', 'indigo', 'juniper', 'cedar', 'aspen', 'birch', 'maple', 'willow', 'oak', 'elm',
    'sequoia', 'redwood', 'douglas', 'yew', 'pine', 'fir', 'spruce', 'hemlock', 'larch', 'cypress',
    'alex', 'sam', 'jamie', 'pat', 'kim', 'lee', 'jo', 'ray', 'drew', 'fin',
    'ash', 'blair', 'cam', 'dana', 'emery', 'fran', 'gale', 'hayden', 'ivy', 'jules',
    'kai', 'lane', 'noel', 'olive', 'parker', 'remy', 'skye', 'umair', 'val', 'wren',
    'xander', 'yuki', 'zion', 'ace', 'beau', 'cash', 'dash', 'echo', 'fox', 'gray',
    'hawk', 'jazz', 'knight', 'lux', 'moon', 'nova', 'orion', 'quasar', 'raven', 'storm',
    'thunder', 'venus', 'wolf', 'xenon', 'yellow', 'zen', 'alpha', 'beta', 'gamma', 'delta',
    'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
    'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const name = names[i % names.length];
    const number = Math.floor(i / names.length) + 1;
    usernames.push(`${prefix}_${name}${number > 1 ? number : ''}`);
  }
  
  return usernames;
}

const adminUsernames = generateAdminUsernames(120);

// Generate random phone numbers
function generatePhoneNumber() {
  const areaCodes = ['212', '213', '214', '215', '216', '217', '218', '219', '220', '221'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}-${prefix}-${lineNumber}`;
}

// Generate random addresses
function generateAddress() {
  const streets = ['Main St', 'Oak Ave', 'Elm St', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Birch Way', 'Willow Ct', 'Spruce St', 'Cherry Ave'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const zip = Math.floor(Math.random() * 90000) + 10000;
  return `${number} ${street}, ${city}, NY ${zip}`;
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    
    // Create users
    console.log('Creating users...');
    const users = [];
    for (let i = 0; i < 120; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        name: userNames[i % userNames.length], // Use modulo to cycle through names
        email: `user${i + 1}@example.com`,
        password: hashedPassword,
        phone: generatePhoneNumber(),
        address: generateAddress(),
        isActive: Math.random() > 0.1 // 90% active users
      });
      users.push(user);
    }
    console.log(`Created ${users.length} users`);
    
    // Create admins
    console.log('Creating admins...');
    const admins = [];
    for (let i = 0; i < 120; i++) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await Admin.create({
        username: adminUsernames[i % adminUsernames.length], // Use modulo to cycle through usernames
        email: `admin${i + 1}@restaurant.com`,
        password: hashedPassword,
        role: 'admin',
        isActive: Math.random() > 0.05 // 95% active admins
      });
      admins.push(admin);
    }
    console.log(`Created ${admins.length} admins`);
    
    // Create menu items
    console.log('Creating menu items...');
    const menuItems = [];
    const menuData = [
      { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs and lemon', price: 28.99, category: 'Main Course', image: 'grilled-salmon.jpg', isAvailable: true },
      { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and mozzarella', price: 24.99, category: 'Main Course', image: 'chicken-parmesan.jpg', isAvailable: true },
      { name: 'Ribeye Steak', description: '12oz prime ribeye with garlic butter', price: 34.99, category: 'Main Course', image: 'ribeye-steak.jpg', isAvailable: true },
      { name: 'Bruschetta', description: 'Toasted bread with tomatoes, basil, and olive oil', price: 8.99, category: 'Appetizer', image: 'bruschetta.jpg', isAvailable: true },
      { name: 'Shrimp Cocktail', description: 'Chilled shrimp with cocktail sauce', price: 12.99, category: 'Appetizer', image: 'shrimp-cocktail.jpg', isAvailable: true },
      { name: 'Calamari Rings', description: 'Crispy fried calamari with marinara', price: 11.99, category: 'Appetizer', image: 'calamari-rings.jpg', isAvailable: true },
      { name: 'Loaded Nachos', description: 'Tortilla chips with cheese, beans, and toppings', price: 14.99, category: 'Appetizer', image: 'loaded-nachos.jpg', isAvailable: true },
      { name: 'Truffle Fries', description: 'Crispy fries with truffle oil and parmesan', price: 9.99, category: 'Side Dish', image: 'truffle-fries.jpg', isAvailable: true },
      { name: 'Chicken Wings', description: 'Buffalo wings with blue cheese dip', price: 16.99, category: 'Appetizer', image: 'chicken-wings.jpg', isAvailable: true },
      { name: 'Avocado Toast', description: 'Sourdough toast with avocado and microgreens', price: 12.99, category: 'Breakfast', image: 'avocado-toast.jpg', isAvailable: true },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 8.99, category: 'Dessert', image: 'chocolate-lava-cake.jpg', isAvailable: true },
      { name: 'Tiramisu', description: 'Classic Italian dessert with coffee and mascarpone', price: 9.99, category: 'Dessert', image: 'tiramisu.jpg', isAvailable: true },
      { name: 'Creme Brulee', description: 'Vanilla custard with caramelized sugar', price: 7.99, category: 'Dessert', image: 'creme-brulee.jpg', isAvailable: true },
      { name: 'Artisan Coffee', description: 'Freshly brewed premium coffee', price: 4.99, category: 'Beverage', image: 'artisan-coffee.jpg', isAvailable: true },
      { name: 'Green Tea Latte', description: 'Matcha green tea with steamed milk', price: 5.99, category: 'Beverage', image: 'green-tea-latte.jpg', isAvailable: true },
      { name: 'Orange Juice', description: 'Fresh squeezed orange juice', price: 3.99, category: 'Beverage', image: 'orange-juice.jpg', isAvailable: true }
    ];

    for (const item of menuData) {
      const menuItem = await MenuItem.create(item);
      menuItems.push(menuItem);
    }
    console.log(`Created ${menuItems.length} menu items`);

    // Create orders
    console.log('Creating orders...');
    const orders = [];
    const orderStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    const specialInstructions = [
      'Extra crispy please', 'No onions', 'Light on the sauce', 'Well done', 'Medium rare',
      'Extra cheese', 'No dairy', 'Gluten free', 'Extra spicy', 'Mild please',
      'Extra sauce on the side', 'No salt', 'Low sodium', 'Extra fresh', 'Quick service please',
      'Extra napkins', 'Fork and knife please', 'To go container', 'Extra dressing', 'No garnish'
    ];

    for (let i = 0; i < 150; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomMenuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalAmount = (randomMenuItem.price * quantity).toFixed(2);
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const specialInstruction = Math.random() > 0.7 ? specialInstructions[Math.floor(Math.random() * specialInstructions.length)] : null;
      const tableNumber = Math.floor(Math.random() * 20) + 1;
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days

      const order = await Order.create({
        userId: randomUser.id,
        items: [{
          id: randomMenuItem.id,
          name: randomMenuItem.name,
          price: randomMenuItem.price,
          quantity: quantity
        }],
        totalAmount: totalAmount,
        status: status,
        orderType: 'dine-in',
        tableNumber: tableNumber.toString(),
        customerName: randomUser.name,
        customerPhone: randomUser.phone,
        orderNotes: specialInstruction,
        createdAt: createdAt,
        updatedAt: createdAt
      });
      orders.push(order);
    }
    console.log(`Created ${orders.length} orders`);

    console.log('Database seeding completed successfully!');
    console.log(`Summary:`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Admins: ${admins.length}`);
    console.log(`- Menu Items: ${menuItems.length}`);
    console.log(`- Orders: ${orders.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
seedDatabase(); 