import { PrismaClient, UserRole, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_PERMISSIONS, RESOURCES } from '../src/config/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Migrate legacy Manal branding
  const legacyAdmin = await prisma.user.findUnique({ where: { email: 'admin@manalperfumes.com' } });
  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: { email: 'admin@luxuryperfumes.com' },
    });
  }

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@luxuryperfumes.com' },
    update: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'admin@luxuryperfumes.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      phone: '+252-61-000-0000',
    },
  });

  console.log('✅ Super Admin ready (admin@luxuryperfumes.com)');

  const staffUsers: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone: string;
  }> = [
    {
      email: 'admin.staff@luxuryperfumes.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      phone: '+252-61-000-0001',
    },
    {
      email: 'manager@luxuryperfumes.com',
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.MANAGER,
      phone: '+252-61-000-0002',
    },
    {
      email: 'cashier@luxuryperfumes.com',
      firstName: 'Cashier',
      lastName: 'User',
      role: UserRole.CASHIER,
      phone: '+252-61-000-0003',
    },
    {
      email: 'inventory@luxuryperfumes.com',
      firstName: 'Inventory',
      lastName: 'Staff',
      role: UserRole.INVENTORY_STAFF,
      phone: '+252-61-000-0004',
    },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {
        role: staff.role,
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        password: hashedPassword,
        isActive: true,
        deletedAt: null,
      },
      create: {
        email: staff.email,
        password: hashedPassword,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        phone: staff.phone,
      },
    });
  }

  console.log('✅ Staff users ready (ADMIN, MANAGER, CASHIER, INVENTORY_STAFF)');

  await prisma.companySettings.updateMany({
    where: {
      OR: [
        { companyName: { contains: 'Manal', mode: 'insensitive' } },
        { invoiceFooter: { contains: 'Manal', mode: 'insensitive' } },
      ],
    },
    data: {
      companyName: 'Luxury Perfumes',
      invoiceFooter: 'Thank you for shopping at Luxury Perfumes',
    },
  });

  await prisma.companySettings.updateMany({
    where: { email: 'info@manalperfumes.com' },
    data: { email: 'info@luxuryperfumes.com' },
  });

  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      companyName: 'Luxury Perfumes',
      email: 'info@luxuryperfumes.com',
      invoiceFooter: 'Thank you for shopping at Luxury Perfumes',
    },
    create: {
      id: 'default',
      companyName: 'Luxury Perfumes',
      address: 'Hargeisa, Somaliland',
      phone: '+252-63-000-0000',
      email: 'info@luxuryperfumes.com',
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 5,
      taxEnabled: true,
      invoicePrefix: 'MP',
      invoiceFooter: 'Thank you for shopping at Luxury Perfumes',
      lowStockThreshold: 5,
    },
  });

  console.log('✅ Company settings created');

  for (const role of Object.keys(DEFAULT_PERMISSIONS) as UserRole[]) {
    for (const resource of RESOURCES) {
      const perms = DEFAULT_PERMISSIONS[role][resource];
      await prisma.permission.upsert({
        where: { role_resource: { role, resource } },
        update: perms,
        create: { role, resource, ...perms },
      });
    }
  }

  console.log('✅ Permissions created');

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Men' }, update: {}, create: { name: 'Men', description: 'Men fragrances' } }),
    prisma.category.upsert({ where: { name: 'Women' }, update: {}, create: { name: 'Women', description: 'Women fragrances' } }),
    prisma.category.upsert({ where: { name: 'Unisex' }, update: {}, create: { name: 'Unisex', description: 'Unisex fragrances' } }),
    prisma.category.upsert({ where: { name: 'Niche' }, update: {}, create: { name: 'Niche', description: 'Niche luxury fragrances' } }),
    prisma.category.upsert({ where: { name: 'Gift Sets' }, update: {}, create: { name: 'Gift Sets', description: 'Perfume gift sets' } }),
  ]);

  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: 'Dior' }, update: {}, create: { name: 'Dior', description: 'French luxury house' } }),
    prisma.brand.upsert({ where: { name: 'Chanel' }, update: {}, create: { name: 'Chanel', description: 'French luxury brand' } }),
    prisma.brand.upsert({ where: { name: 'Tom Ford' }, update: {}, create: { name: 'Tom Ford', description: 'American luxury brand' } }),
    prisma.brand.upsert({ where: { name: 'Creed' }, update: {}, create: { name: 'Creed', description: 'British luxury house' } }),
    prisma.brand.upsert({ where: { name: 'Xerjoff' }, update: {}, create: { name: 'Xerjoff', description: 'Italian niche brand' } }),
    prisma.brand.upsert({ where: { name: 'Initio' }, update: {}, create: { name: 'Initio', description: 'French niche brand' } }),
    prisma.brand.upsert({ where: { name: 'Roja' }, update: {}, create: { name: 'Roja', description: 'British luxury niche' } }),
  ]);

  console.log('✅ Categories and brands created');

  const products = [
    { name: 'Sauvage EDP 100ml', sku: 'MP-DIOR-001', brandId: brands[0].id, categoryId: categories[0].id, costPrice: 85, sellingPrice: 150, stockQuantity: 25, minimumStock: 5 },
    { name: 'Bleu de Chanel 100ml', sku: 'MP-CHANEL-001', brandId: brands[1].id, categoryId: categories[0].id, costPrice: 90, sellingPrice: 165, stockQuantity: 20, minimumStock: 5 },
    { name: 'Black Orchid 100ml', sku: 'MP-TF-001', brandId: brands[2].id, categoryId: categories[2].id, costPrice: 120, sellingPrice: 220, stockQuantity: 15, minimumStock: 3 },
    { name: 'Aventus 100ml', sku: 'MP-CREED-001', brandId: brands[3].id, categoryId: categories[0].id, costPrice: 200, sellingPrice: 380, stockQuantity: 10, minimumStock: 3 },
    { name: 'Naxos 100ml', sku: 'MP-XERJ-001', brandId: brands[4].id, categoryId: categories[3].id, costPrice: 180, sellingPrice: 320, stockQuantity: 8, minimumStock: 2 },
    { name: 'Side Effect 90ml', sku: 'MP-INIT-001', brandId: brands[5].id, categoryId: categories[3].id, costPrice: 150, sellingPrice: 280, stockQuantity: 12, minimumStock: 3 },
    { name: 'Enigma 100ml', sku: 'MP-ROJA-001', brandId: brands[6].id, categoryId: categories[1].id, costPrice: 250, sellingPrice: 450, stockQuantity: 6, minimumStock: 2 },
    { name: 'J\'adore 100ml', sku: 'MP-DIOR-002', brandId: brands[0].id, categoryId: categories[1].id, costPrice: 80, sellingPrice: 145, stockQuantity: 18, minimumStock: 5 },
    { name: 'Chance Eau Tendre 100ml', sku: 'MP-CHANEL-002', brandId: brands[1].id, categoryId: categories[1].id, costPrice: 85, sellingPrice: 155, stockQuantity: 3, minimumStock: 5 },
    { name: 'Oud Wood 100ml', sku: 'MP-TF-002', brandId: brands[2].id, categoryId: categories[2].id, costPrice: 130, sellingPrice: 240, stockQuantity: 14, minimumStock: 3 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        brandId: p.brandId,
        categoryId: p.categoryId,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity,
        minimumStock: p.minimumStock,
        status: 'ACTIVE',
      },
      create: {
        ...p,
        barcode: `MP${p.sku.replace(/-/g, '')}`,
        description: `Luxury ${p.name}`,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Products created');

  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'Luxury Scents Ltd', companyName: 'Luxury Scents International', email: 'orders@luxuryscents.com', phone: '+971-4-000-0000', address: 'Dubai, UAE' } }),
    prisma.supplier.create({ data: { name: 'Fragrance World', companyName: 'Fragrance World Trading', email: 'sales@fragranceworld.com', phone: '+44-20-000-0000', address: 'London, UK' } }),
    prisma.supplier.create({ data: { name: 'Niche Perfumes Co', companyName: 'Niche Perfumes Company', email: 'info@nicheperfumes.com', phone: '+33-1-000-0000', address: 'Paris, France' } }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Mohamed Ibrahim', phone: '+252-63-111-1111', email: 'mohamed@email.com', address: 'Hargeisa', isVip: true, loyaltyPoints: 150, totalSpent: 1500 } }),
    prisma.customer.create({ data: { name: 'Amina Yusuf', phone: '+252-63-222-2222', email: 'amina@email.com', address: 'Hargeisa', isVip: false, loyaltyPoints: 50, totalSpent: 500 } }),
    prisma.customer.create({ data: { name: 'Omar Hassan', phone: '+252-63-333-3333', email: 'omar@email.com', address: 'Berbera', isVip: true, loyaltyPoints: 200, totalSpent: 2000 } }),
  ]);

  console.log('✅ Suppliers and customers created');

  // Demo sales for dashboard charts & analytics
  const productRecords = await prisma.product.findMany({ where: { deletedAt: null } });
  const bySku = Object.fromEntries(productRecords.map((pr) => [pr.sku, pr]));

  const demoSales = [
    { num: 'SL-DEMO-001', monthsAgo: 5, customerIdx: 0, items: [{ sku: 'MP-DIOR-001', qty: 2 }, { sku: 'MP-CHANEL-001', qty: 1 }] },
    { num: 'SL-DEMO-002', monthsAgo: 4, customerIdx: 1, items: [{ sku: 'MP-CREED-001', qty: 1 }, { sku: 'MP-TF-001', qty: 1 }] },
    { num: 'SL-DEMO-003', monthsAgo: 3, customerIdx: 2, items: [{ sku: 'MP-DIOR-001', qty: 3 }, { sku: 'MP-DIOR-002', qty: 2 }] },
    { num: 'SL-DEMO-004', monthsAgo: 2, customerIdx: 0, items: [{ sku: 'MP-XERJ-001', qty: 1 }, { sku: 'MP-INIT-001', qty: 2 }] },
    { num: 'SL-DEMO-005', monthsAgo: 1, customerIdx: 1, items: [{ sku: 'MP-CHANEL-002', qty: 2 }, { sku: 'MP-TF-002', qty: 1 }] },
    { num: 'SL-DEMO-006', monthsAgo: 0, customerIdx: 2, items: [{ sku: 'MP-DIOR-001', qty: 1 }, { sku: 'MP-ROJA-001', qty: 1 }] },
    { num: 'SL-DEMO-007', monthsAgo: 0, customerIdx: 0, items: [{ sku: 'MP-CHANEL-001', qty: 2 }, { sku: 'MP-CREED-001', qty: 1 }] },
  ];

  for (const demo of demoSales) {
    const saleDate = new Date();
    saleDate.setMonth(saleDate.getMonth() - demo.monthsAgo);
    saleDate.setDate(15);

    const lineItems = demo.items.map((item) => {
      const product = bySku[item.sku];
      if (!product) return null;
      const unitPrice = Number(product.sellingPrice);
      return {
        productId: product.id,
        quantity: item.qty,
        unitPrice,
        discount: 0,
        total: unitPrice * item.qty,
      };
    }).filter(Boolean) as Array<{ productId: string; quantity: number; unitPrice: number; discount: number; total: number }>;

    if (lineItems.length === 0) continue;

    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;

    const existing = await prisma.sale.findUnique({ where: { saleNumber: demo.num } });
    if (existing) {
      await prisma.saleItem.deleteMany({ where: { saleId: existing.id } });
      await prisma.payment.deleteMany({ where: { saleId: existing.id } });
      await prisma.sale.update({
        where: { id: existing.id },
        data: {
          customerId: customers[demo.customerIdx].id,
          userId: superAdmin.id,
          status: 'COMPLETED',
          subtotal,
          tax,
          totalAmount,
          completedAt: saleDate,
          createdAt: saleDate,
          items: { create: lineItems },
        },
      });
      await prisma.payment.create({
        data: {
          saleId: existing.id,
          amount: totalAmount,
          method: 'CASH',
          status: 'PAID',
          paidAt: saleDate,
        },
      });
    } else {
      const sale = await prisma.sale.create({
        data: {
          saleNumber: demo.num,
          customerId: customers[demo.customerIdx].id,
          userId: superAdmin.id,
          status: 'COMPLETED',
          subtotal,
          discount: 0,
          tax,
          totalAmount,
          completedAt: saleDate,
          createdAt: saleDate,
          items: { create: lineItems },
        },
      });
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          amount: totalAmount,
          method: 'CASH',
          status: 'PAID',
          paidAt: saleDate,
        },
      });
    }
  }

  console.log('✅ Demo sales created');

  await prisma.auditLog.createMany({
    data: [
      { userId: superAdmin.id, action: AuditAction.APPROVE, entity: 'Sale', details: 'Completed sale SL-DEMO-006' },
      { userId: superAdmin.id, action: AuditAction.APPROVE, entity: 'Purchase', details: 'Approved purchase order' },
      { userId: superAdmin.id, action: AuditAction.LOGIN, entity: 'User', details: 'User logged in' },
      { userId: superAdmin.id, action: AuditAction.CREATE, entity: 'Sale', details: 'Created sale SL-DEMO-007' },
    ],
  });

  console.log('✅ Activity logs created');

  await prisma.notification.create({
    data: {
      type: 'SYSTEM',
      title: 'Welcome to Luxury Perfumes ERP',
      message: 'System has been initialized successfully. Start managing your luxury perfume business!',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: 'Chance Eau Tendre 100ml is running low (3 units remaining)',
      data: { productSku: 'MP-CHANEL-002' },
    },
  });

  console.log('✅ Notifications created');
  console.log('\n🎉 Seeding completed!');
  console.log('\n📧 Login (password for all: admin123):');
  console.log('   Super Admin: admin@luxuryperfumes.com');
  console.log('   Admin:       admin.staff@luxuryperfumes.com');
  console.log('   Manager:     manager@luxuryperfumes.com');
  console.log('   Cashier:     cashier@luxuryperfumes.com');
  console.log('   Inventory:   inventory@luxuryperfumes.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
