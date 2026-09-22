-- truetrace_schema.sql (SQL Server / T-SQL)
-- Schema for the current backend/server.js (backend/auth-google.js, backend/auth-password.js).
-- Run this whole script against your local SQL Server instance (SSMS, Azure Data Studio, or sqlcmd)
-- to stand up a local copy of the database this backend expects.

-- Drop and recreate the whole database rather than individual tables. This is local scratch
-- data, and a plain DROP TABLE dbo.products can fail with a foreign-key error if this DB was
-- ever used for the old inventory-master-detail schema too: SQL Server's default collation is
-- case-insensitive, so dbo.products here and dbo.Products from that other schema are the SAME
-- object, and that schema's dbo.Inventory table still references it via FK. Wiping the database
-- sidesteps that (and any other leftover-object) collision entirely.
IF DB_ID(N'truetrace') IS NOT NULL
BEGIN
    ALTER DATABASE truetrace SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE truetrace;
END
GO

CREATE DATABASE truetrace;
GO

USE truetrace;
GO

-- USERS table backs both Google OAuth login (auth-google.js) and email/password login (auth-password.js).
CREATE TABLE dbo.users (
    id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    google_id     NVARCHAR(64)   NULL,          -- NULL for password-registered users
    email         NVARCHAR(255)  NOT NULL,
    password_hash NVARCHAR(255)  NULL,          -- NULL for Google-only users; bcrypt hash otherwise
    name          NVARCHAR(255)  NULL,
    avatar_url    NVARCHAR(512)  NULL,
    provider      NVARCHAR(20)   NOT NULL CONSTRAINT DF_users_provider DEFAULT ('google'),
    is_active     BIT            NOT NULL CONSTRAINT DF_users_is_active DEFAULT (1),
    last_login    DATETIME2      NULL,
    created_at    DATETIME2      NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME())
);
GO

-- Every user needs a unique email.
CREATE UNIQUE INDEX UQ_users_email ON dbo.users(email);
GO

-- google_id must be unique too, but many password-only users will have NULL here.
-- A plain UNIQUE constraint in SQL Server allows only ONE NULL total (unlike MySQL, which
-- allows many) -- a filtered index is the fix, and it's what makes the Google-login upsert
-- (MERGE ... ON google_id) behave the same way the original ON DUPLICATE KEY UPDATE did.
CREATE UNIQUE INDEX UQ_users_google_id ON dbo.users(google_id) WHERE google_id IS NOT NULL;
GO

-- PRODUCTS table. Unlike the old inventory-master-detail schema, this version keeps quantity
-- inline as `qty` on the product row instead of a separate Inventory table.
CREATE TABLE dbo.products (
    ProductID   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SKU         NVARCHAR(32)   NOT NULL,
    ProductName NVARCHAR(100)  NOT NULL,
    Category    NVARCHAR(50)   NULL,
    UnitPrice   DECIMAL(10,2)  NOT NULL,
    qty         INT            NOT NULL CONSTRAINT DF_products_qty DEFAULT (0),
    ImageUrl    NVARCHAR(255)  NULL,
    Description NVARCHAR(MAX)  NULL
);
GO

CREATE UNIQUE INDEX UQ_products_sku ON dbo.products(SKU);
GO

-- === SEED DATA: 100 sample products (same demo data as the old schema, merged with its
-- matching Inventory quantities into the single `qty` column this version uses) ===
SET IDENTITY_INSERT dbo.products ON;
GO
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (1, 'SKU-0001', 'Item_1_Spo', 'Sports', 268.55, 108);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (2, 'SKU-0002', 'Item_2_Gro', 'Groceries', 272.52, 116);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (3, 'SKU-0003', 'Item_3_Gro', 'Groceries', 439.49, 117);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (4, 'SKU-0004', 'Item_4_Clo', 'Clothing', 384.00, 281);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (5, 'SKU-0005', 'Item_5_Fur', 'Furniture', 427.42, 304);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (6, 'SKU-0006', 'Item_6_Spo', 'Sports', 211.06, 241);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (7, 'SKU-0007', 'Item_7_Too', 'Tools', 170.66, 341);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (8, 'SKU-0008', 'Item_8_Toy', 'Toys', 217.28, 273);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (9, 'SKU-0009', 'Item_9_Fur', 'Furniture', 271.69, 420);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (10, 'SKU-0010', 'Item_10_Ele', 'Electronics', 61.82, 117);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (11, 'SKU-0011', 'Item_11_Clo', 'Clothing', 283.45, 30);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (12, 'SKU-0012', 'Item_12_Gro', 'Groceries', 407.36, 121);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (13, 'SKU-0013', 'Item_13_Too', 'Tools', 65.16, 384);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (14, 'SKU-0014', 'Item_14_Fur', 'Furniture', 364.23, 379);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (15, 'SKU-0015', 'Item_15_Boo', 'Books', 215.46, 13);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (16, 'SKU-0016', 'Item_16_Boo', 'Books', 448.53, 6);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (17, 'SKU-0017', 'Item_17_Too', 'Tools', 142.59, 128);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (18, 'SKU-0018', 'Item_18_Spo', 'Sports', 270.91, 119);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (19, 'SKU-0019', 'Item_19_Ele', 'Electronics', 122.77, 457);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (20, 'SKU-0020', 'Item_20_Boo', 'Books', 359.29, 33);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (21, 'SKU-0021', 'Item_21_Boo', 'Books', 457.68, 257);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (22, 'SKU-0022', 'Item_22_Toy', 'Toys', 373.39, 405);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (23, 'SKU-0023', 'Item_23_Toy', 'Toys', 475.93, 218);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (24, 'SKU-0024', 'Item_24_Clo', 'Clothing', 468.32, 185);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (25, 'SKU-0025', 'Item_25_Boo', 'Books', 43.05, 73);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (26, 'SKU-0026', 'Item_26_Ele', 'Electronics', 73.09, 469);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (27, 'SKU-0027', 'Item_27_Toy', 'Toys', 16.54, 393);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (28, 'SKU-0028', 'Item_28_Too', 'Tools', 378.96, 54);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (29, 'SKU-0029', 'Item_29_Toy', 'Toys', 238.55, 203);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (30, 'SKU-0030', 'Item_30_Spo', 'Sports', 375.33, 7);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (31, 'SKU-0031', 'Item_31_Spo', 'Sports', 130.09, 309);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (32, 'SKU-0032', 'Item_32_Toy', 'Toys', 105.30, 426);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (33, 'SKU-0033', 'Item_33_Too', 'Tools', 120.90, 268);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (34, 'SKU-0034', 'Item_34_Fur', 'Furniture', 129.37, 130);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (35, 'SKU-0035', 'Item_35_Too', 'Tools', 303.84, 441);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (36, 'SKU-0036', 'Item_36_Gro', 'Groceries', 102.27, 276);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (37, 'SKU-0037', 'Item_37_Toy', 'Toys', 248.14, 325);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (38, 'SKU-0038', 'Item_38_Boo', 'Books', 160.26, 346);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (39, 'SKU-0039', 'Item_39_Ele', 'Electronics', 143.20, 222);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (40, 'SKU-0040', 'Item_40_Too', 'Tools', 160.26, 439);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (41, 'SKU-0041', 'Item_41_Clo', 'Clothing', 65.42, 19);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (42, 'SKU-0042', 'Item_42_Toy', 'Toys', 396.77, 126);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (43, 'SKU-0043', 'Item_43_Toy', 'Toys', 266.14, 197);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (44, 'SKU-0044', 'Item_44_Gro', 'Groceries', 205.81, 354);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (45, 'SKU-0045', 'Item_45_Boo', 'Books', 448.24, 205);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (46, 'SKU-0046', 'Item_46_Spo', 'Sports', 105.09, 489);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (47, 'SKU-0047', 'Item_47_Clo', 'Clothing', 490.71, 28);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (48, 'SKU-0048', 'Item_48_Clo', 'Clothing', 125.22, 246);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (49, 'SKU-0049', 'Item_49_Gro', 'Groceries', 260.57, 241);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (50, 'SKU-0050', 'Item_50_Ele', 'Electronics', 419.43, 297);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (51, 'SKU-0051', 'Item_51_Boo', 'Books', 396.75, 79);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (52, 'SKU-0052', 'Item_52_Clo', 'Clothing', 339.17, 265);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (53, 'SKU-0053', 'Item_53_Toy', 'Toys', 181.14, 73);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (54, 'SKU-0054', 'Item_54_Boo', 'Books', 476.73, 179);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (55, 'SKU-0055', 'Item_55_Clo', 'Clothing', 422.37, 258);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (56, 'SKU-0056', 'Item_56_Gro', 'Groceries', 347.55, 265);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (57, 'SKU-0057', 'Item_57_Ele', 'Electronics', 308.10, 256);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (58, 'SKU-0058', 'Item_58_Ele', 'Electronics', 432.74, 349);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (59, 'SKU-0059', 'Item_59_Clo', 'Clothing', 58.96, 447);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (60, 'SKU-0060', 'Item_60_Too', 'Tools', 213.61, 208);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (61, 'SKU-0061', 'Item_61_Toy', 'Toys', 290.69, 55);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (62, 'SKU-0062', 'Item_62_Gro', 'Groceries', 23.23, 424);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (63, 'SKU-0063', 'Item_63_Toy', 'Toys', 175.69, 82);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (64, 'SKU-0064', 'Item_64_Boo', 'Books', 260.44, 86);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (65, 'SKU-0065', 'Item_65_Gro', 'Groceries', 286.73, 211);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (66, 'SKU-0066', 'Item_66_Clo', 'Clothing', 41.53, 135);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (67, 'SKU-0067', 'Item_67_Boo', 'Books', 154.34, 305);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (68, 'SKU-0068', 'Item_68_Ele', 'Electronics', 330.08, 307);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (69, 'SKU-0069', 'Item_69_Gro', 'Groceries', 402.52, 50);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (70, 'SKU-0070', 'Item_70_Spo', 'Sports', 136.08, 207);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (71, 'SKU-0071', 'Item_71_Too', 'Tools', 389.73, 180);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (72, 'SKU-0072', 'Item_72_Gro', 'Groceries', 265.13, 20);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (73, 'SKU-0073', 'Item_73_Too', 'Tools', 47.06, 250);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (74, 'SKU-0074', 'Item_74_Too', 'Tools', 408.13, 274);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (75, 'SKU-0075', 'Item_75_Too', 'Tools', 479.17, 231);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (76, 'SKU-0076', 'Item_76_Spo', 'Sports', 109.25, 174);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (77, 'SKU-0077', 'Item_77_Clo', 'Clothing', 321.72, 166);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (78, 'SKU-0078', 'Item_78_Toy', 'Toys', 16.16, 449);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (79, 'SKU-0079', 'Item_79_Boo', 'Books', 87.21, 430);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (80, 'SKU-0080', 'Item_80_Toy', 'Toys', 38.53, 64);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (81, 'SKU-0081', 'Item_81_Ele', 'Electronics', 161.92, 305);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (82, 'SKU-0082', 'Item_82_Too', 'Tools', 331.98, 203);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (83, 'SKU-0083', 'Item_83_Clo', 'Clothing', 168.28, 251);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (84, 'SKU-0084', 'Item_84_Toy', 'Toys', 228.63, 308);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (85, 'SKU-0085', 'Item_85_Spo', 'Sports', 189.52, 103);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (86, 'SKU-0086', 'Item_86_Clo', 'Clothing', 327.13, 454);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (87, 'SKU-0087', 'Item_87_Gro', 'Groceries', 101.20, 392);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (88, 'SKU-0088', 'Item_88_Gro', 'Groceries', 439.91, 293);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (89, 'SKU-0089', 'Item_89_Too', 'Tools', 384.43, 255);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (90, 'SKU-0090', 'Item_90_Fur', 'Furniture', 153.99, 477);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (91, 'SKU-0091', 'Item_91_Gro', 'Groceries', 175.22, 103);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (92, 'SKU-0092', 'Item_92_Clo', 'Clothing', 158.36, 467);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (93, 'SKU-0093', 'Item_93_Fur', 'Furniture', 466.15, 244);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (94, 'SKU-0094', 'Item_94_Clo', 'Clothing', 60.56, 219);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (95, 'SKU-0095', 'Item_95_Ele', 'Electronics', 407.28, 454);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (96, 'SKU-0096', 'Item_96_Spo', 'Sports', 469.00, 438);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (97, 'SKU-0097', 'Item_97_Too', 'Tools', 457.33, 84);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (98, 'SKU-0098', 'Item_98_Fur', 'Furniture', 115.90, 257);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (99, 'SKU-0099', 'Item_99_Boo', 'Books', 194.29, 424);
INSERT INTO dbo.products (ProductID, SKU, ProductName, Category, UnitPrice, qty) VALUES (100, 'SKU-0100', 'Item_100_Gro', 'Groceries', 174.73, 250);
GO
SET IDENTITY_INSERT dbo.products OFF;
GO
