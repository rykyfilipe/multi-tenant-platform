#!/usr/bin/env node
/** @format */

/**
 * Script de testare pentru verificarea fix-urilor de register
 * 
 * Acest script verifică că:
 * 1. User-ul nou are tenantId setat
 * 2. Tenant-ul există și este asociat corect
 * 3. Database-ul are nume "Main Database"
 * 4. Session include tenantId
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testRegistrationFix() {
  console.log('🔍 Verificare Fix-uri Registration...\n');

  try {
    // 1. Găsește ultimul user creat (presupunem că e cel de test)
    const latestUser = await prisma.user.findFirst({
      orderBy: { id: 'desc' },
      include: {
        tenant: {
          include: {
            databases: true,
          },
        },
      },
    });

    if (!latestUser) {
      console.log('❌ Nu există utilizatori în baza de date');
      return;
    }

    console.log('👤 Utilizator găsit:', {
      id: latestUser.id,
      email: latestUser.email,
      firstName: latestUser.firstName,
      tenantId: latestUser.tenantId,
    });

    // 2. Verifică că user-ul are tenantId
    if (!latestUser.tenantId) {
      console.log('❌ FAIL: User-ul nu are tenantId setat!');
      console.log('   Aceasta este problema care cauzează loading infinit.');
    } else {
      console.log('✅ PASS: User-ul are tenantId setat:', latestUser.tenantId);
    }

    // 3. Verifică că tenant-ul există
    if (!latestUser.tenant) {
      console.log('❌ FAIL: Tenant-ul nu există!');
    } else {
      console.log('✅ PASS: Tenant găsit:', {
        id: latestUser.tenant.id,
        name: latestUser.tenant.name,
        adminId: latestUser.tenant.adminId,
      });

      // 4. Verifică că tenant-ul are database
      if (!latestUser.tenant.databases || latestUser.tenant.databases.length === 0) {
        console.log('❌ FAIL: Tenant-ul nu are niciun database!');
      } else {
        console.log('✅ PASS: Database-uri găsite:', latestUser.tenant.databases.length);
        
        latestUser.tenant.databases.forEach((db, index) => {
          console.log(`   Database ${index + 1}:`, {
            id: db.id,
            name: db.name || '(fără nume)',
            tenantId: db.tenantId,
          });

          if (!db.name || db.name === '') {
            console.log('   ⚠️  WARNING: Database fără nume explicit');
          } else if (db.name === 'Main Database') {
            console.log('   ✅ Database cu nume corect');
          }
        });
      }
    }

    // 5. Rezumat final
    console.log('\n📊 REZUMAT:');
    const checks = [
      { name: 'User are tenantId', passed: !!latestUser.tenantId },
      { name: 'Tenant există', passed: !!latestUser.tenant },
      { name: 'Database există', passed: latestUser.tenant?.databases?.length > 0 },
      { 
        name: 'Database are nume', 
        passed: latestUser.tenant?.databases?.some(db => db.name && db.name !== '') 
      },
    ];

    checks.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(check => check.passed);
    
    if (allPassed) {
      console.log('\n🎉 Toate verificările au trecut! Registration fix funcționează corect.');
    } else {
      console.log('\n⚠️  Unele verificări au eșuat. Verifică documentația REGISTRATION_FIXES.md');
    }

  } catch (error) {
    console.error('❌ Eroare la testare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificare pentru un email specific (opțional)
async function testSpecificUser(email) {
  console.log(`🔍 Verificare pentru user: ${email}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          include: {
            databases: true,
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ User cu email ${email} nu există`);
      return;
    }

    console.log('✅ User găsit:', {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        databases: user.tenant.databases.length,
      } : null,
    });

    if (user.tenant?.databases) {
      console.log('\n📂 Databases:');
      user.tenant.databases.forEach((db, i) => {
        console.log(`  ${i + 1}. ${db.name || '(fără nume)'} (ID: ${db.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Eroare:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main
const args = process.argv.slice(2);

if (args.length > 0) {
  // Test pentru un email specific
  testSpecificUser(args[0]);
} else {
  // Test pentru ultimul user
  testRegistrationFix();
}

