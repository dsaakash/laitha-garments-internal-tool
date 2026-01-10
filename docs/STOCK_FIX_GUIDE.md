# Stock Reconciliation and Fix Guide

## Problem

Many inventory items have incorrect stock values:
- Negative `quantity_in` values (should never be negative)
- Negative `quantity_out` values (should never be negative)
- Stock relationship mismatches: `current_stock ≠ quantity_in - quantity_out`
- Negative `current_stock` values

## Root Causes

1. **Historical Bug**: The purchase order update bug we fixed earlier caused incorrect stock calculations
2. **No Validation**: Previous code didn't prevent negative values
3. **Data Corruption**: Multiple updates without proper validation led to data inconsistencies

## Solution

### 1. Run Stock Reconciliation Script

We've created a comprehensive reconciliation script that will:
- Find all inventory items with issues
- Calculate expected values from purchase orders and sales
- Auto-fix issues where possible
- Report items that need manual review

**To run the script:**
```bash
node scripts/reconcile-stock.js
```

**What it does:**
1. Scans all inventory items
2. Identifies issues:
   - Negative `quantity_in`
   - Negative `quantity_out`
   - Stock relationship mismatches
   - Negative `current_stock`
3. Calculates expected values from:
   - Purchase orders (for `quantity_in`)
   - Sales (for `quantity_out`)
4. Auto-fixes issues where possible
5. Reports items needing manual review

### 2. Validation Added

We've added validation to prevent future issues:

**Stock Adjustment API** (`app/api/inventory/[id]/stock/route.ts`):
- ✅ Prevents negative `quantity_in`
- ✅ Prevents negative `quantity_out`
- ✅ Validates `current_stock = quantity_in - quantity_out`
- ✅ Auto-corrects relationship mismatches

**Purchase Order APIs**:
- ✅ Prevents negative `quantity_in` when adding/updating purchases
- ✅ Maintains stock relationship: `current_stock = quantity_in - quantity_out`
- ✅ Validates before updating inventory

**Sales API**:
- ✅ Maintains stock relationship when processing sales
- ✅ Prevents negative stock (already had this)

### 3. Manual Fix Process

For items that need manual review:

1. **Check Purchase Orders**: Look at all purchase orders for the product
   - Sum up all quantities purchased
   - This should be the `quantity_in` value

2. **Check Sales**: Look at all sales for the product
   - Sum up all quantities sold
   - This should be the `quantity_out` value

3. **Calculate Correct Stock**:
   ```
   quantity_in = Sum of all purchase order quantities
   quantity_out = Sum of all sales quantities
   current_stock = quantity_in - quantity_out
   ```

4. **Update Manually**: Use the stock adjustment API with `type: 'set'`:
   ```javascript
   POST /api/inventory/[id]/stock
   {
     "type": "set",
     "quantity": <correct_current_stock>
   }
   ```
   This will automatically calculate `quantity_in` based on `quantity_out`.

## Prevention

Going forward, all stock updates will:
- ✅ Validate that `quantity_in >= 0`
- ✅ Validate that `quantity_out >= 0`
- ✅ Maintain `current_stock = quantity_in - quantity_out`
- ✅ Use transactions for atomicity
- ✅ Log warnings for any mismatches

## Quick Fix Commands

### Check Current Issues
```bash
node scripts/check-stock.js
```

### Reconcile All Stock
```bash
node scripts/reconcile-stock.js
```

### Fix Specific Item (via API)
```bash
# Set stock directly (will auto-calculate quantity_in)
curl -X POST http://localhost:3000/api/inventory/[id]/stock \
  -H "Content-Type: application/json" \
  -d '{"type": "set", "quantity": <correct_stock_value>}'
```

## Expected Results

After running the reconciliation script:
- ✅ All negative `quantity_in` values fixed
- ✅ All negative `quantity_out` values fixed
- ✅ All stock relationship mismatches corrected
- ✅ Items with complex issues flagged for manual review

## Notes

- The reconciliation script is **safe** - it only fixes obvious issues
- Items with complex discrepancies are **not** auto-fixed (requires manual review)
- All fixes maintain the relationship: `current_stock = quantity_in - quantity_out`
- Future updates will prevent these issues from occurring again
