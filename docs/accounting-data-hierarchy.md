# Accounting Data Hierarchy

This document describes the three-tier hierarchy of accounting data in the system and how they relate to each other.

## Overview

The accounting system operates on three distinct levels that build upon each other:

1. **Standard Accounts (Regnskapslinjer)** - Top level
2. **Trial Balance (Saldobalanse)** - Middle level  
3. **General Ledger (Hovedbok)** - Base level

## Level 1: Standard Accounts (Regnskapslinjer)

**Purpose**: Standardized statement lines for financial reporting
**Examples**: 
- "10 Salgsinntekter" (Sales Income)
- "20 Varekostnad" (Cost of Goods Sold)
- "70 Annen driftskostnad" (Other Operating Expenses)

**Characteristics**:
- Pre-defined, standardized categories
- Used for consistent financial statement presentation
- Map to ranges of trial balance accounts
- Stored in `standard_accounts` table

## Level 2: Trial Balance (Saldobalanse)

**Purpose**: Individual account balances that accumulate transactions
**Examples**:
- Account 3010: "Salgsinntekter Norge"
- Account 3020: "Salgsinntekter utland" 
- Account 3100: "Provisjonsinntekter"

**Characteristics**:
- Individual chart of accounts entries
- Show accumulated balances for a period
- Multiple trial balance accounts map to one standard account
- Example: Accounts 3000-3200 → Standard Account "10 Salgsinntekter"
- Stored in `trial_balances` table with `client_chart_of_accounts` reference

## Level 3: General Ledger (Hovedbok)

**Purpose**: Individual transactions that create the data foundation
**Examples**:
- Individual sales invoices
- Individual purchase transactions
- Journal entries

**Characteristics**:
- Detailed transaction-level data
- Contains all debits and credits
- Accumulates to form trial balance amounts
- Forms the "population" for audit sampling and analysis
- Stored in `general_ledger_transactions` table

## Data Flow and Relationships

```
Standard Accounts (Statement Lines)
    ↑ (aggregates from)
Trial Balance Accounts (Individual Accounts)
    ↑ (accumulates from)  
General Ledger (Individual Transactions)
```

### Mapping System

**Trial Balance → Standard Accounts**:
- Managed through `trial_balance_mappings` table
- Maps `account_number` to `statement_line_number`
- Uses account number ranges (e.g., 3000-3200 → "10")
- Supports both automatic rule-based mapping and manual mappings

**General Ledger → Trial Balance**:
- Linked through `account_number` field
- General ledger transactions reference chart of accounts
- Trial balance shows the sum of all GL transactions for each account

## Key Business Rules

1. **One-to-Many Relationships**: 
   - One Standard Account can have many Trial Balance accounts
   - One Trial Balance account can have many General Ledger transactions

2. **Accumulation Logic**:
   - Trial Balance = Sum of General Ledger transactions by account
   - Standard Account totals = Sum of mapped Trial Balance accounts

3. **Analysis Populations**:
   - Audit sampling works at the General Ledger (transaction) level
   - Risk analysis considers all three levels but focuses on transaction details

## Critical Implementation Notes

- **Don't mix levels**: When working with populations, ensure you're operating at the correct level
- **Maintain mapping integrity**: Changes to account mappings affect financial statement presentation
- **Version consistency**: All three levels must be from compatible time periods/versions
- **Audit trail**: Changes at any level should be tracked for compliance

## Database Tables Reference

- `standard_accounts` - Level 1 (Statement Lines)
- `trial_balances` + `client_chart_of_accounts` - Level 2 (Account Balances)  
- `general_ledger_transactions` - Level 3 (Individual Transactions)
- `trial_balance_mappings` - Maps Level 2 → Level 1
- `account_mappings` - Alternative mapping system (firm-specific)

This hierarchy ensures data integrity and enables proper financial reporting while maintaining detailed audit trails.