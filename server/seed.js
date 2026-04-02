/**
 * Seed script — populates the VehicleConfig collection with representative VCdb data.
 * Run with: npm run seed
 */
const mongoose = require('mongoose');
const VehicleConfig = require('./models/VehicleConfig');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autoadvisor';

// ---------------------------------------------------------------------------
// Representative VCdb seed data: 12 makes, dozens of models, 1980–2025
// Year ranges are historically accurate per model production dates.
// ---------------------------------------------------------------------------
const vehicles = [
  // ── Toyota ───────────────────────────────────────────────────────────────
  // Camry: US market 1983–present
  ...expand('Toyota', 'Camry', range(1983, 1991), [
    { trim: 'DX',     engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'DX',     engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LE',     engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Camry', range(1992, 2001), [
    { trim: 'CE',     engine: '2.2L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LE',     engine: '2.2L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XLE',    engine: '3.0L V6',         bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Camry', range(2002, 2014), [
    { trim: 'LE',     engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',     engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XLE',    engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE V6',  engine: '3.5L V6',         bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Camry', range(2015, 2025), [
    { trim: 'LE',    engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',    engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XLE',   engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XSE',   engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'TRD',   engine: '3.5L V6',         bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),

  // Corolla: 1980–present
  ...expand('Toyota', 'Corolla', range(1980, 1992), [
    { trim: 'DX',      engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'DX',      engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SR5',     engine: '1.6L 4-Cylinder', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Toyota', 'Corolla', range(1993, 2002), [
    { trim: 'Base',   engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'CE',     engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LE',     engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Corolla', range(2003, 2014), [
    { trim: 'CE',     engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LE',     engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'S',      engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Toyota', 'Corolla', range(2015, 2025), [
    { trim: 'L',     engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'LE',    engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SE',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'XSE',   engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
  ]),

  // RAV4: 1996–present
  ...expand('Toyota', 'RAV4', range(1996, 2005), [
    { trim: 'Base',   engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Base',   engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'RAV4', range(2006, 2014), [
    { trim: 'Base',   engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '3.5L V6',        bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'RAV4', range(2015, 2025), [
    { trim: 'LE',        engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XLE',       engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Adventure', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'TRD Off-Road', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // Tacoma: 1995–present
  ...expand('Toyota', 'Tacoma', range(1995, 2004), [
    { trim: 'Base',     engine: '2.4L 4-Cylinder', bodyStyle: 'Truck', driveType: '2WD', transmission: 'Manual' },
    { trim: 'SR5',      engine: '2.7L 4-Cylinder', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'PreRunner', engine: '3.4L V6',        bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Tacoma', range(2005, 2015), [
    { trim: 'Base',      engine: '2.7L 4-Cylinder', bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'PreRunner', engine: '4.0L V6',         bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'TRD Sport', engine: '4.0L V6',         bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'TRD Off-Road', engine: '4.0L V6',      bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Toyota', 'Tacoma', range(2016, 2025), [
    { trim: 'SR',        engine: '2.7L 4-Cylinder', bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'SR5',       engine: '3.5L V6',         bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'TRD Sport', engine: '3.5L V6',         bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'TRD Off-Road', engine: '3.5L V6',      bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited',   engine: '3.5L V6',         bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),

  // ── Honda ────────────────────────────────────────────────────────────────
  // Civic: 1980–present
  ...expand('Honda', 'Civic', range(1980, 1991), [
    { trim: 'Base',    engine: '1.3L 4-Cylinder', bodyStyle: 'Hatchback', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'DX',      engine: '1.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Si',      engine: '1.5L 4-Cylinder', bodyStyle: 'Hatchback', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Honda', 'Civic', range(1992, 2000), [
    { trim: 'DX',      engine: '1.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX',      engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Si',      engine: '1.6L 4-Cylinder', bodyStyle: 'Coupe', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Honda', 'Civic', range(2001, 2015), [
    { trim: 'DX',      engine: '1.7L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LX',      engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX',      engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Si',      engine: '2.0L 4-Cylinder', bodyStyle: 'Coupe', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Honda', 'Civic', range(2016, 2025), [
    { trim: 'LX',    engine: '2.0L 4-Cylinder',  bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Sport', engine: '2.0L 4-Cylinder',  bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'EX',    engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Touring', engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Si',    engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
  ]),

  // Accord: 1980–present
  ...expand('Honda', 'Accord', range(1980, 1989), [
    { trim: 'Base',  engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'LX',    engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE-i',  engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Honda', 'Accord', range(1990, 2002), [
    { trim: 'DX',    engine: '2.2L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LX',    engine: '2.2L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX',    engine: '2.3L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX V6', engine: '3.0L V6',         bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Honda', 'Accord', range(2003, 2014), [
    { trim: 'LX',      engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX',      engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX-L',   engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX-L V6', engine: '3.5L V6',        bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Honda', 'Accord', range(2015, 2025), [
    { trim: 'LX',      engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Sport',   engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'EX-L',   engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Touring', engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),

  // CR-V: 1997–present
  ...expand('Honda', 'CR-V', range(1997, 2006), [
    { trim: 'LX',    engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'EX',    engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Honda', 'CR-V', range(2007, 2016), [
    { trim: 'LX',    engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'EX',    engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'EX-L',  engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Touring', engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
  ]),
  ...expand('Honda', 'CR-V', range(2017, 2025), [
    { trim: 'LX',      engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'EX',      engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'EX-L',    engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Touring', engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
  ]),

  // ── Ford ─────────────────────────────────────────────────────────────────
  // F-150: 1980–present
  ...expand('Ford', 'F-150', range(1980, 1996), [
    { trim: 'XL',      engine: '4.9L Inline-6',  bodyStyle: 'Truck', driveType: '2WD', transmission: 'Manual' },
    { trim: 'XLT',     engine: '5.0L V8',        bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '5.8L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'F-150', range(1997, 2003), [
    { trim: 'XL',      engine: '4.2L V6',        bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '4.6L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Lariat',  engine: '5.4L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'F-150', range(2004, 2014), [
    { trim: 'XL',      engine: '3.7L V6',        bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '5.0L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Lariat',  engine: '3.5L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'King Ranch', engine: '3.5L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'F-150', range(2015, 2025), [
    { trim: 'XL',       engine: '3.3L V6',         bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',      engine: '2.7L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Lariat',   engine: '3.5L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'King Ranch', engine: '3.5L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Raptor',   engine: '3.5L EcoBoost V6', bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),

  // Mustang: 1980–present
  ...expand('Ford', 'Mustang', range(1980, 1993), [
    { trim: 'Base',  engine: '2.3L 4-Cylinder', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'LX',    engine: '2.3L 4-Cylinder', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'GT',    engine: '5.0L V8',         bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'GT',    engine: '5.0L V8',         bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Ford', 'Mustang', range(1994, 2004), [
    { trim: 'Base',  engine: '3.8L V6',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'GT',    engine: '4.6L V8',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'GT',    engine: '4.6L V8',  bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'Cobra', engine: '4.6L Supercharged V8', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Ford', 'Mustang', range(2005, 2014), [
    { trim: 'V6',    engine: '3.7L V6',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'GT',    engine: '5.0L V8',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'GT',    engine: '5.0L V8',  bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'Shelby GT500', engine: '5.8L Supercharged V8', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Ford', 'Mustang', range(2015, 2025), [
    { trim: 'EcoBoost',        engine: '2.3L EcoBoost 4-Cylinder', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'EcoBoost',        engine: '2.3L EcoBoost 4-Cylinder', bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'GT',              engine: '5.0L V8',                  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'GT',              engine: '5.0L V8',                  bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'Shelby GT500',    engine: '5.2L Supercharged V8',     bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
  ]),

  // Explorer: 1991–present
  ...expand('Ford', 'Explorer', range(1991, 2001), [
    { trim: 'XL',     engine: '4.0L V6', bodyStyle: 'SUV', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',    engine: '4.0L V6', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Eddie Bauer', engine: '5.0L V8', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'Explorer', range(2002, 2010), [
    { trim: 'XLS',     engine: '4.0L V6', bodyStyle: 'SUV', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '4.0L V6', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '4.6L V8', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'Explorer', range(2011, 2015), [
    { trim: 'Base',    engine: '3.5L V6',              bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '3.5L V6',              bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '3.5L EcoBoost V6',     bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Ford', 'Explorer', range(2016, 2025), [
    { trim: 'Base',    engine: '2.3L EcoBoost 4-Cylinder', bodyStyle: 'SUV', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'XLT',     engine: '2.3L EcoBoost 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '3.0L EcoBoost V6',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'ST',      engine: '3.0L EcoBoost V6',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // ── Chevrolet ────────────────────────────────────────────────────────────
  // C/K 1500 (1980–1998) → Silverado 1500 (1999–present)
  ...expand('Chevrolet', 'C/K 1500', range(1980, 1998), [
    { trim: 'Scottsdale', engine: '4.3L V6',  bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'Silverado',  engine: '5.0L V8',  bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'Silverado',  engine: '5.7L V8',  bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Chevrolet', 'Silverado 1500', range(1999, 2006), [
    { trim: 'WT',     engine: '4.3L V6',  bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'LS',     engine: '5.3L V8',  bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'LT',     engine: '5.3L V8',  bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Chevrolet', 'Silverado 1500', range(2007, 2014), [
    { trim: 'WT',     engine: '4.3L V6',  bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'LT',     engine: '5.3L V8',  bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'LTZ',    engine: '6.2L V8',  bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Chevrolet', 'Silverado 1500', range(2015, 2025), [
    { trim: 'WT',       engine: '4.3L V6',        bodyStyle: 'Truck', driveType: '2WD', transmission: 'Automatic' },
    { trim: 'LT',       engine: '5.3L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'RST',      engine: '5.3L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'LTZ',      engine: '6.2L V8',        bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'High Country', engine: '6.2L V8',    bodyStyle: 'Truck', driveType: '4WD', transmission: 'Automatic' },
  ]),

  // Camaro: 1982–2002, 2010–present
  ...expand('Chevrolet', 'Camaro', range(1982, 2002), [
    { trim: 'Sport Coupe', engine: '3.1L V6',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'Z28',         engine: '5.7L V8',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'SS',          engine: '5.7L V8',  bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Chevrolet', 'Camaro', range(2010, 2025), [
    { trim: 'LS',  engine: '3.6L V6',                bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'SS',  engine: '6.2L V8',                bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'ZL1', engine: '6.2L Supercharged V8',   bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),

  // Equinox: 2005–present
  ...expand('Chevrolet', 'Equinox', range(2005, 2009), [
    { trim: 'LS',  engine: '3.4L V6', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LT',  engine: '3.4L V6', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Chevrolet', 'Equinox', range(2010, 2017), [
    { trim: 'LS',  engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LT',  engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'LTZ', engine: '3.6L V6',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Chevrolet', 'Equinox', range(2018, 2025), [
    { trim: 'L',        engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LS',       engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'LT',       engine: '1.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Premier',  engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // ── BMW ──────────────────────────────────────────────────────────────────
  // 3 Series: 1980–present
  ...expand('BMW', '3 Series', range(1980, 1991), [
    { trim: '318i',  engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Manual' },
    { trim: '325i',  engine: '2.5L 6-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Manual' },
    { trim: '325i',  engine: '2.5L 6-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
  ]),
  ...expand('BMW', '3 Series', range(1992, 2005), [
    { trim: '320i',  engine: '2.0L 6-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
    { trim: '325i',  engine: '2.5L 6-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
    { trim: '330i',  engine: '3.0L 6-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'M3',    engine: '3.2L 6-Cylinder', bodyStyle: 'Coupe', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('BMW', '3 Series', range(2006, 2016), [
    { trim: '328i',  engine: '3.0L 6-Cylinder',         bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
    { trim: '328i xDrive', engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
    { trim: '335i',  engine: '3.0L Turbo 6-Cylinder',   bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
  ]),
  ...expand('BMW', '3 Series', range(2017, 2025), [
    { trim: '330i',    engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Automatic' },
    { trim: '330i xDrive', engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'M340i',  engine: '3.0L Turbo 6-Cylinder',  bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // X5: 2000–present
  ...expand('BMW', 'X5', range(2000, 2006), [
    { trim: '3.0i',   engine: '3.0L 6-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: '4.4i',   engine: '4.4L V8',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('BMW', 'X5', range(2007, 2018), [
    { trim: 'xDrive35i', engine: '3.0L Turbo 6-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'xDrive50i', engine: '4.4L Twin-Turbo V8',    bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('BMW', 'X5', range(2019, 2025), [
    { trim: 'sDrive40i', engine: '3.0L Turbo 6-Cylinder', bodyStyle: 'SUV', driveType: 'RWD', transmission: 'Automatic' },
    { trim: 'xDrive40i', engine: '3.0L Turbo 6-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'M50i',      engine: '4.4L Twin-Turbo V8',    bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // ── Subaru ───────────────────────────────────────────────────────────────
  // Outback: 1995–present
  ...expand('Subaru', 'Outback', range(1995, 2004), [
    { trim: 'Base',    engine: '2.5L 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '2.5L 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'H6-3.0', engine: '3.0L 6-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Subaru', 'Outback', range(2005, 2014), [
    { trim: 'Base',    engine: '2.5L 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Premium', engine: '2.5L 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Limited', engine: '2.5L 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: '3.6R',    engine: '3.6L 6-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
  ]),
  ...expand('Subaru', 'Outback', range(2015, 2025), [
    { trim: 'Base',     engine: '2.5L 4-Cylinder',       bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Premium',  engine: '2.5L 4-Cylinder',       bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Limited',  engine: '2.5L 4-Cylinder',       bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Onyx Edition XT', engine: '2.4L Turbo 4-Cylinder', bodyStyle: 'Wagon', driveType: 'AWD', transmission: 'CVT' },
  ]),

  // Impreza/WRX: Impreza 1993–present, WRX standalone 2002–present
  ...expand('Subaru', 'Impreza', range(1993, 2014), [
    { trim: 'Base',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'RS',      engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Manual' },
    { trim: 'WRX',     engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Manual' },
    { trim: 'WRX STI', engine: '2.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Manual' },
  ]),
  ...expand('Subaru', 'WRX', range(2015, 2025), [
    { trim: 'Base',    engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Manual' },
    { trim: 'Premium', engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Manual' },
    { trim: 'Limited', engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'CVT' },
  ]),

  // ── Hyundai ──────────────────────────────────────────────────────────────
  // Elantra: 1991–present
  ...expand('Hyundai', 'Elantra', range(1991, 2000), [
    { trim: 'Base',  engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'GLS',   engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Hyundai', 'Elantra', range(2001, 2016), [
    { trim: 'GLS',   engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',    engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Sport', engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Hyundai', 'Elantra', range(2017, 2025), [
    { trim: 'SE',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SEL',   engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'N Line', engine: '1.6L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),

  // Tucson: 2005–present
  ...expand('Hyundai', 'Tucson', range(2005, 2009), [
    { trim: 'GLS',    engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',     engine: '2.7L V6',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Hyundai', 'Tucson', range(2010, 2015), [
    { trim: 'GLS',    engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',     engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Hyundai', 'Tucson', range(2016, 2025), [
    { trim: 'SE',      engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SEL',     engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // Sonata: 1989–present
  ...expand('Hyundai', 'Sonata', range(1989, 2004), [
    { trim: 'Base',  engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'GLS',   engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'GLS V6', engine: '2.7L V6',        bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Hyundai', 'Sonata', range(2005, 2025), [
    { trim: 'SE',      engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SEL',     engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '1.6L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),

  // ── Nissan ───────────────────────────────────────────────────────────────
  // Altima: 1993–present (Stanza before that)
  ...expand('Nissan', 'Altima', range(1993, 2001), [
    { trim: 'XE',    engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'GXE',   engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE',    engine: '2.4L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Nissan', 'Altima', range(2002, 2014), [
    { trim: 'S',     engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SV',    engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SL',    engine: '3.5L V6',         bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
  ]),
  ...expand('Nissan', 'Altima', range(2015, 2025), [
    { trim: 'S',         engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SV',        engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'SR',        engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'Platinum',  engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'CVT' },
  ]),

  // Sentra: 1982–present
  ...expand('Nissan', 'Sentra', range(1982, 1999), [
    { trim: 'Base',  engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'XE',    engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'SE-R',  engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
  ]),
  ...expand('Nissan', 'Sentra', range(2000, 2025), [
    { trim: 'S',     engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SV',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SR',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'CVT' },
  ]),

  // Rogue: 2008–present
  ...expand('Nissan', 'Rogue', range(2008, 2016), [
    { trim: 'S',     engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SV',    engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'SL',    engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
  ]),
  ...expand('Nissan', 'Rogue', range(2017, 2025), [
    { trim: 'S',       engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'CVT' },
    { trim: 'SV',      engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'SL',      engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
    { trim: 'Platinum', engine: '1.5L Turbo 3-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'CVT' },
  ]),

  // ── Jeep ─────────────────────────────────────────────────────────────────
  // Wrangler (YJ): 1987–1995, (TJ): 1997–2006, (JK): 2007–2017, (JL): 2018–present
  ...expand('Jeep', 'Wrangler', range(1987, 1995), [
    { trim: 'S',       engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sahara',  engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
  ]),
  ...expand('Jeep', 'Wrangler', range(1997, 2006), [
    { trim: 'SE',      engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sport',   engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sahara',  engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Rubicon', engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
  ]),
  ...expand('Jeep', 'Wrangler', range(2007, 2017), [
    { trim: 'Sport',   engine: '3.6L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sahara',  engine: '3.6L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Rubicon', engine: '3.6L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
  ]),
  ...expand('Jeep', 'Wrangler', range(2018, 2025), [
    { trim: 'Sport',   engine: '3.6L V6',            bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sport S', engine: '3.6L V6',            bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Sahara',  engine: '2.0L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Rubicon', engine: '3.6L V6',            bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
  ]),

  // Grand Cherokee: 1993–present
  ...expand('Jeep', 'Grand Cherokee', range(1993, 1998), [
    { trim: 'Laredo',  engine: '4.0L Inline-6',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '5.2L V8',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Jeep', 'Grand Cherokee', range(1999, 2004), [
    { trim: 'Laredo',  engine: '4.0L Inline-6',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '4.7L V8',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Overland', engine: '4.7L V8',        bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Jeep', 'Grand Cherokee', range(2005, 2014), [
    { trim: 'Laredo',    engine: '3.6L V6',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited',   engine: '3.6L V6',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Overland',  engine: '5.7L V8',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'SRT',       engine: '6.4L V8',  bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Jeep', 'Grand Cherokee', range(2015, 2025), [
    { trim: 'Laredo',    engine: '3.6L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited',   engine: '3.6L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Overland',  engine: '5.7L V8',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'SRT',       engine: '6.4L V8',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Trackhawk', engine: '6.2L Supercharged V8', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),

  // Cherokee (XJ): 1984–2001, (KL): 2014–present
  ...expand('Jeep', 'Cherokee', range(1984, 2001), [
    { trim: 'Base',    engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: '4WD', transmission: 'Manual' },
    { trim: 'Sport',   engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
    { trim: 'Limited', engine: '4.0L Inline-6',   bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),
  ...expand('Jeep', 'Cherokee', range(2014, 2025), [
    { trim: 'Latitude',   engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Latitude Plus', engine: '2.4L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Limited',    engine: '3.2L V6',         bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Trailhawk',  engine: '3.2L V6',         bodyStyle: 'SUV', driveType: '4WD', transmission: 'Automatic' },
  ]),

  // ── Tesla ────────────────────────────────────────────────────────────────
  ...expand('Tesla', 'Model S', range(2012, 2025), [
    { trim: 'Base',       engine: 'Electric', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Single-Speed' },
    { trim: 'Long Range', engine: 'Electric', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Single-Speed' },
    { trim: 'Plaid',      engine: 'Electric', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Single-Speed' },
  ]),
  ...expand('Tesla', 'Model 3', range(2018, 2025), [
    { trim: 'Standard Range Plus', engine: 'Electric', bodyStyle: 'Sedan', driveType: 'RWD', transmission: 'Single-Speed' },
    { trim: 'Long Range',          engine: 'Electric', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Single-Speed' },
    { trim: 'Performance',         engine: 'Electric', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Single-Speed' },
  ]),
  ...expand('Tesla', 'Model X', range(2016, 2025), [
    { trim: 'Long Range', engine: 'Electric', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Single-Speed' },
    { trim: 'Plaid',      engine: 'Electric', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Single-Speed' },
  ]),
  ...expand('Tesla', 'Model Y', range(2020, 2025), [
    { trim: 'Long Range',  engine: 'Electric', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Single-Speed' },
    { trim: 'Performance', engine: 'Electric', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Single-Speed' },
  ]),

  // ── Mazda ────────────────────────────────────────────────────────────────
  // Mazda3 (Protegé before 2004): 2004–present
  ...expand('Mazda', 'Protegé', range(1990, 2003), [
    { trim: 'DX',    engine: '1.6L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Manual' },
    { trim: 'LX',    engine: '1.8L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'ES',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Mazda', 'Mazda3', range(2004, 2018), [
    { trim: 'i Sport',    engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'i Touring',  engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 's Grand Touring', engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'i Sport',    engine: '2.0L 4-Cylinder', bodyStyle: 'Hatchback', driveType: 'FWD', transmission: 'Automatic' },
  ]),
  ...expand('Mazda', 'Mazda3', range(2019, 2025), [
    { trim: 'Base',     engine: '2.0L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Select',   engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Preferred', engine: '2.5L 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Turbo',    engine: '2.5L Turbo 4-Cylinder', bodyStyle: 'Sedan', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Base',     engine: '2.0L 4-Cylinder', bodyStyle: 'Hatchback', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Turbo',    engine: '2.5L Turbo 4-Cylinder', bodyStyle: 'Hatchback', driveType: 'AWD', transmission: 'Automatic' },
  ]),

  // MX-5 Miata: 1990–present
  ...expand('Mazda', 'MX-5 Miata', range(1990, 2005), [
    { trim: 'Base',   engine: '1.8L 4-Cylinder', bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'LS',     engine: '1.8L 4-Cylinder', bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
  ]),
  ...expand('Mazda', 'MX-5 Miata', range(2006, 2025), [
    { trim: 'Sport',       engine: '2.0L 4-Cylinder', bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Manual' },
    { trim: 'Grand Touring', engine: '2.0L 4-Cylinder', bodyStyle: 'Convertible', driveType: 'RWD', transmission: 'Automatic' },
  ]),

  // CX-5: 2013–present
  ...expand('Mazda', 'CX-5', range(2013, 2016), [
    { trim: 'Sport',   engine: '2.0L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Touring', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Grand Touring', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
  ...expand('Mazda', 'CX-5', range(2017, 2025), [
    { trim: 'Sport',     engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'FWD', transmission: 'Automatic' },
    { trim: 'Touring',   engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Grand Touring', engine: '2.5L 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
    { trim: 'Turbo',     engine: '2.5L Turbo 4-Cylinder', bodyStyle: 'SUV', driveType: 'AWD', transmission: 'Automatic' },
  ]),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function range(start, end) {
  const years = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

function expand(make, model, years, variants) {
  const configs = [];
  for (const year of years) {
    for (const v of variants) {
      configs.push({
        year, make, model,
        trim:         v.trim         || '',
        engine:       v.engine       || '',
        bodyStyle:    v.bodyStyle    || '',
        driveType:    v.driveType    || '',
        transmission: v.transmission || '',
      });
    }
  }
  return configs;
}

// ---------------------------------------------------------------------------
// Run seed
// ---------------------------------------------------------------------------
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await VehicleConfig.deleteMany({});
    console.log('Cleared existing vehicle configs');

    await VehicleConfig.insertMany(vehicles);
    console.log(`Inserted ${vehicles.length} vehicle configurations`);

    await mongoose.connection.close();
    console.log('Done — database seeded successfully');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
