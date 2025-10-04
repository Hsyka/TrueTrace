
CREATE DATABASE IF NOT EXISTS truetrace;
USE truetrace;

-- PRODUCTS table holds product master data
CREATE TABLE Products (
    ProductID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    SKU VARCHAR(32) NOT NULL UNIQUE,
    ProductName VARCHAR(100) NOT NULL,
    Category VARCHAR(50),
    UnitPrice DECIMAL(10,2) NOT NULL,
    ImageUrl VARCHAR(255) DEFAULT NULL,
    Description TEXT DEFAULT NULL
);

-- INVENTORY table tracks on-hand counts by product
-- (If you plan to support multiple locations later, add a LocationID column and make (ProductID, LocationID) the PK.)
CREATE TABLE Inventory (
    ProductID INT NOT NULL,
    QuantityOnHand INT NOT NULL,
    CONSTRAINT fk_inventory_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT pk_inventory PRIMARY KEY (ProductID)
);


-- === INSERTS: PRODUCTS ===
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (1, 'SKU-0001', 'Item_1_Spo', 'Sports', 268.55);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (2, 'SKU-0002', 'Item_2_Gro', 'Groceries', 272.52);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (3, 'SKU-0003', 'Item_3_Gro', 'Groceries', 439.49);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (4, 'SKU-0004', 'Item_4_Clo', 'Clothing', 384.00);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (5, 'SKU-0005', 'Item_5_Fur', 'Furniture', 427.42);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (6, 'SKU-0006', 'Item_6_Spo', 'Sports', 211.06);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (7, 'SKU-0007', 'Item_7_Too', 'Tools', 170.66);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (8, 'SKU-0008', 'Item_8_Toy', 'Toys', 217.28);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (9, 'SKU-0009', 'Item_9_Fur', 'Furniture', 271.69);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (10, 'SKU-0010', 'Item_10_Ele', 'Electronics', 61.82);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (11, 'SKU-0011', 'Item_11_Clo', 'Clothing', 283.45);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (12, 'SKU-0012', 'Item_12_Gro', 'Groceries', 407.36);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (13, 'SKU-0013', 'Item_13_Too', 'Tools', 65.16);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (14, 'SKU-0014', 'Item_14_Fur', 'Furniture', 364.23);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (15, 'SKU-0015', 'Item_15_Boo', 'Books', 215.46);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (16, 'SKU-0016', 'Item_16_Boo', 'Books', 448.53);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (17, 'SKU-0017', 'Item_17_Too', 'Tools', 142.59);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (18, 'SKU-0018', 'Item_18_Spo', 'Sports', 270.91);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (19, 'SKU-0019', 'Item_19_Ele', 'Electronics', 122.77);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (20, 'SKU-0020', 'Item_20_Boo', 'Books', 359.29);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (21, 'SKU-0021', 'Item_21_Boo', 'Books', 457.68);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (22, 'SKU-0022', 'Item_22_Toy', 'Toys', 373.39);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (23, 'SKU-0023', 'Item_23_Toy', 'Toys', 475.93);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (24, 'SKU-0024', 'Item_24_Clo', 'Clothing', 468.32);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (25, 'SKU-0025', 'Item_25_Boo', 'Books', 43.05);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (26, 'SKU-0026', 'Item_26_Ele', 'Electronics', 73.09);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (27, 'SKU-0027', 'Item_27_Toy', 'Toys', 16.54);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (28, 'SKU-0028', 'Item_28_Too', 'Tools', 378.96);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (29, 'SKU-0029', 'Item_29_Toy', 'Toys', 238.55);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (30, 'SKU-0030', 'Item_30_Spo', 'Sports', 375.33);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (31, 'SKU-0031', 'Item_31_Spo', 'Sports', 130.09);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (32, 'SKU-0032', 'Item_32_Toy', 'Toys', 105.30);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (33, 'SKU-0033', 'Item_33_Too', 'Tools', 120.90);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (34, 'SKU-0034', 'Item_34_Fur', 'Furniture', 129.37);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (35, 'SKU-0035', 'Item_35_Too', 'Tools', 303.84);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (36, 'SKU-0036', 'Item_36_Gro', 'Groceries', 102.27);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (37, 'SKU-0037', 'Item_37_Toy', 'Toys', 248.14);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (38, 'SKU-0038', 'Item_38_Boo', 'Books', 160.26);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (39, 'SKU-0039', 'Item_39_Ele', 'Electronics', 143.20);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (40, 'SKU-0040', 'Item_40_Too', 'Tools', 160.26);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (41, 'SKU-0041', 'Item_41_Clo', 'Clothing', 65.42);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (42, 'SKU-0042', 'Item_42_Toy', 'Toys', 396.77);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (43, 'SKU-0043', 'Item_43_Toy', 'Toys', 266.14);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (44, 'SKU-0044', 'Item_44_Gro', 'Groceries', 205.81);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (45, 'SKU-0045', 'Item_45_Boo', 'Books', 448.24);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (46, 'SKU-0046', 'Item_46_Spo', 'Sports', 105.09);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (47, 'SKU-0047', 'Item_47_Clo', 'Clothing', 490.71);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (48, 'SKU-0048', 'Item_48_Clo', 'Clothing', 125.22);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (49, 'SKU-0049', 'Item_49_Gro', 'Groceries', 260.57);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (50, 'SKU-0050', 'Item_50_Ele', 'Electronics', 419.43);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (51, 'SKU-0051', 'Item_51_Boo', 'Books', 396.75);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (52, 'SKU-0052', 'Item_52_Clo', 'Clothing', 339.17);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (53, 'SKU-0053', 'Item_53_Toy', 'Toys', 181.14);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (54, 'SKU-0054', 'Item_54_Boo', 'Books', 476.73);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (55, 'SKU-0055', 'Item_55_Clo', 'Clothing', 422.37);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (56, 'SKU-0056', 'Item_56_Gro', 'Groceries', 347.55);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (57, 'SKU-0057', 'Item_57_Ele', 'Electronics', 308.10);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (58, 'SKU-0058', 'Item_58_Ele', 'Electronics', 432.74);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (59, 'SKU-0059', 'Item_59_Clo', 'Clothing', 58.96);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (60, 'SKU-0060', 'Item_60_Too', 'Tools', 213.61);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (61, 'SKU-0061', 'Item_61_Toy', 'Toys', 290.69);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (62, 'SKU-0062', 'Item_62_Gro', 'Groceries', 23.23);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (63, 'SKU-0063', 'Item_63_Toy', 'Toys', 175.69);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (64, 'SKU-0064', 'Item_64_Boo', 'Books', 260.44);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (65, 'SKU-0065', 'Item_65_Gro', 'Groceries', 286.73);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (66, 'SKU-0066', 'Item_66_Clo', 'Clothing', 41.53);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (67, 'SKU-0067', 'Item_67_Boo', 'Books', 154.34);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (68, 'SKU-0068', 'Item_68_Ele', 'Electronics', 330.08);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (69, 'SKU-0069', 'Item_69_Gro', 'Groceries', 402.52);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (70, 'SKU-0070', 'Item_70_Spo', 'Sports', 136.08);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (71, 'SKU-0071', 'Item_71_Too', 'Tools', 389.73);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (72, 'SKU-0072', 'Item_72_Gro', 'Groceries', 265.13);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (73, 'SKU-0073', 'Item_73_Too', 'Tools', 47.06);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (74, 'SKU-0074', 'Item_74_Too', 'Tools', 408.13);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (75, 'SKU-0075', 'Item_75_Too', 'Tools', 479.17);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (76, 'SKU-0076', 'Item_76_Spo', 'Sports', 109.25);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (77, 'SKU-0077', 'Item_77_Clo', 'Clothing', 321.72);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (78, 'SKU-0078', 'Item_78_Toy', 'Toys', 16.16);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (79, 'SKU-0079', 'Item_79_Boo', 'Books', 87.21);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (80, 'SKU-0080', 'Item_80_Toy', 'Toys', 38.53);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (81, 'SKU-0081', 'Item_81_Ele', 'Electronics', 161.92);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (82, 'SKU-0082', 'Item_82_Too', 'Tools', 331.98);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (83, 'SKU-0083', 'Item_83_Clo', 'Clothing', 168.28);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (84, 'SKU-0084', 'Item_84_Toy', 'Toys', 228.63);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (85, 'SKU-0085', 'Item_85_Spo', 'Sports', 189.52);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (86, 'SKU-0086', 'Item_86_Clo', 'Clothing', 327.13);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (87, 'SKU-0087', 'Item_87_Gro', 'Groceries', 101.20);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (88, 'SKU-0088', 'Item_88_Gro', 'Groceries', 439.91);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (89, 'SKU-0089', 'Item_89_Too', 'Tools', 384.43);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (90, 'SKU-0090', 'Item_90_Fur', 'Furniture', 153.99);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (91, 'SKU-0091', 'Item_91_Gro', 'Groceries', 175.22);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (92, 'SKU-0092', 'Item_92_Clo', 'Clothing', 158.36);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (93, 'SKU-0093', 'Item_93_Fur', 'Furniture', 466.15);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (94, 'SKU-0094', 'Item_94_Clo', 'Clothing', 60.56);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (95, 'SKU-0095', 'Item_95_Ele', 'Electronics', 407.28);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (96, 'SKU-0096', 'Item_96_Spo', 'Sports', 469.00);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (97, 'SKU-0097', 'Item_97_Too', 'Tools', 457.33);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (98, 'SKU-0098', 'Item_98_Fur', 'Furniture', 115.90);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (99, 'SKU-0099', 'Item_99_Boo', 'Books', 194.29);
INSERT INTO Products (ProductID, SKU, ProductName, Category, UnitPrice) VALUES (100, 'SKU-0100', 'Item_100_Gro', 'Groceries', 174.73);

-- === INSERTS: INVENTORY ===
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (1, 108);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (2, 116);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (3, 117);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (4, 281);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (5, 304);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (6, 241);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (7, 341);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (8, 273);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (9, 420);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (10, 117);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (11, 30);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (12, 121);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (13, 384);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (14, 379);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (15, 13);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (16, 6);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (17, 128);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (18, 119);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (19, 457);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (20, 33);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (21, 257);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (22, 405);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (23, 218);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (24, 185);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (25, 73);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (26, 469);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (27, 393);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (28, 54);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (29, 203);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (30, 7);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (31, 309);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (32, 426);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (33, 268);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (34, 130);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (35, 441);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (36, 276);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (37, 325);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (38, 346);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (39, 222);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (40, 439);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (41, 19);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (42, 126);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (43, 197);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (44, 354);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (45, 205);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (46, 489);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (47, 28);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (48, 246);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (49, 241);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (50, 297);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (51, 79);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (52, 265);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (53, 73);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (54, 179);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (55, 258);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (56, 265);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (57, 256);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (58, 349);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (59, 447);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (60, 208);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (61, 55);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (62, 424);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (63, 82);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (64, 86);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (65, 211);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (66, 135);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (67, 305);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (68, 307);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (69, 50);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (70, 207);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (71, 180);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (72, 20);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (73, 250);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (74, 274);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (75, 231);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (76, 174);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (77, 166);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (78, 449);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (79, 430);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (80, 64);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (81, 305);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (82, 203);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (83, 251);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (84, 308);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (85, 103);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (86, 454);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (87, 392);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (88, 293);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (89, 255);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (90, 477);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (91, 103);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (92, 467);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (93, 244);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (94, 219);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (95, 454);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (96, 438);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (97, 84);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (98, 257);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (99, 424);
INSERT INTO Inventory (ProductID, QuantityOnHand) VALUES (100, 250);

-- If adding these columns to an existing database, run the following:
-- ALTER TABLE Products ADD COLUMN ImageUrl VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE Products ADD COLUMN Description TEXT DEFAULT NULL;
-- If ProductID is not auto-increment on an existing database, run:
-- SAFER OPTIONS (choose one, BACKUP first):
-- 1) If ProductID is already the PRIMARY KEY, enable auto-increment without re-declaring the PK:
--    ALTER TABLE Products MODIFY COLUMN ProductID INT NOT NULL AUTO_INCREMENT;

-- IMPORTANT:
-- - BACK UP your data before running ALTER commands (mysqldump or other backup).
-- - If other tables have foreign keys referencing Products(ProductID), test the change on a copy first.
-- - If you get errors, run SHOW CREATE TABLE Products\G and share the output so the exact migration steps can be recommended.