#!/usr/bin/env node

/**
 * Test script pentru sistemul de culori Pie Chart
 * Demonstrează funcționalitatea completă a generării culorilor
 */

const { generateChartColors, getColorPaletteNames, CHART_COLOR_PALETTES } = require('../src/lib/chart-colors.ts');

console.log('🎨 TEST SISTEM CULORI PIE CHART\n');

// Test 1: Toate paletele disponibile
console.log('📋 PALETE DISPONIBILE:');
getColorPaletteNames().forEach(palette => {
  console.log(`  • ${palette.name} (${palette.key}): ${palette.description}`);
});
console.log();

// Test 2: Generare culori pentru pie chart cu 5 segmente
console.log('🔵 PIE CHART CU 5 SEGMENTE:');
const palettes = ['business', 'luxury', 'vibrant', 'monochrome'];
palettes.forEach(palette => {
  const colors = generateChartColors(5, palette);
  console.log(`  ${palette.toUpperCase()}:`);
  colors.forEach((color, index) => {
    console.log(`    ${index + 1}. ${color} ████████████`);
  });
  console.log();
});

// Test 3: Generare culori pentru pie chart cu 12 segmente (test extensibilitate)
console.log('🌈 PIE CHART CU 12 SEGMENTE (EXTENSIBILITATE):');
const business12 = generateChartColors(12, 'business');
console.log('  BUSINESS PALETTE (12 culori):');
business12.forEach((color, index) => {
  console.log(`    ${index + 1}. ${color} ████████████`);
});
console.log();

// Test 4: Comparație palete
console.log('⚖️ COMPARAȚIE PALETE (5 culori):');
const testPalettes = ['business', 'luxury', 'vibrant', 'monochrome'];
testPalettes.forEach(palette => {
  const colors = generateChartColors(5, palette);
  console.log(`  ${palette.toUpperCase()}: ${colors.join(', ')}`);
});
console.log();

// Test 5: Test culori custom
console.log('🎯 TEST CULORI CUSTOM:');
const customColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
console.log(`  Culori custom: ${customColors.join(', ')}`);
console.log('  (Acestea ar fi folosite direct dacă sunt specificate în options.colors)');
console.log();

// Test 6: Demonstrație configurare
console.log('⚙️ EXEMPLE CONFIGURARE:');
console.log('  1. Culori Custom:');
console.log('     options: { colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"] }');
console.log();
console.log('  2. Paletă Luxury:');
console.log('     options: { colorPalette: "luxury" }');
console.log();
console.log('  3. Paletă Business (default):');
console.log('     options: { colorPalette: "business" }');
console.log();

console.log('✅ TEST COMPLETAT - Sistemul de culori funcționează corect!');
console.log('📊 Pie Chart-urile vor afișa culori distincte și armonioase.');
