using StokMate.Api.Auth;

namespace StokMate.Api.Data;

/// <summary>
/// Bellek içi veritabanını uygulama açılışında örnek verilerle doldurur.
/// Stok değerleri bilinçli olarak karışıktır: bir kısmı tükenmiş, bir kısmı kritik
/// eşiğin altında, çoğu bol; böylece stok rozetleri ve /products/stats anlamlı olur.
/// </summary>
public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        // Tekrar tohumlamayı engelle.
        if (db.Products.Any())
        {
            return;
        }

        var categories = BuildCategories();
        var suppliers = BuildSuppliers();

        db.Users.Add(BuildTestUser());
        db.Categories.AddRange(categories);
        db.Brands.AddRange(BuildBrands());
        db.Suppliers.AddRange(suppliers);
        db.Products.AddRange(BuildProducts(categories, suppliers));

        db.SaveChanges();
    }

    private static User BuildTestUser()
    {
        var salt = PasswordHasher.CreateSalt();

        return new User
        {
            Id = 1,
            Email = "test@ornek.com",
            FullName = "Deniz Yılmaz",
            PasswordSalt = salt,
            PasswordHash = PasswordHasher.Hash("Test1234!", salt)
        };
    }

    private static List<Category> BuildCategories() => new()
    {
        new Category { Id = 1, Name = "İçecek", Slug = "icecek", SortOrder = 1 },
        new Category { Id = 2, Name = "Kahvaltılık", Slug = "kahvaltilik", SortOrder = 2 },
        new Category { Id = 3, Name = "Temel Gıda", Slug = "temel-gida", SortOrder = 3 },
        new Category { Id = 4, Name = "Süt Ürünleri", Slug = "sut-urunleri", SortOrder = 4 },
        new Category { Id = 5, Name = "Atıştırmalık", Slug = "atistirmalik", SortOrder = 5 },
        new Category { Id = 6, Name = "Temizlik", Slug = "temizlik", SortOrder = 6 },
        new Category { Id = 7, Name = "Kişisel Bakım", Slug = "kisisel-bakim", SortOrder = 7 },
        new Category { Id = 8, Name = "Kâğıt Ürünleri", Slug = "kagit-urunleri", SortOrder = 8 }
    };

    private static List<Brand> BuildBrands() => new()
    {
        new Brand { Id = 1, Name = "Ülker" },
        new Brand { Id = 2, Name = "Eti" },
        new Brand { Id = 3, Name = "Torku" },
        new Brand { Id = 4, Name = "Pınar" },
        new Brand { Id = 5, Name = "Sütaş" },
        new Brand { Id = 6, Name = "Coca-Cola" },
        new Brand { Id = 7, Name = "Çaykur" },
        new Brand { Id = 8, Name = "Doğadan" },
        new Brand { Id = 9, Name = "Selpak" },
        new Brand { Id = 10, Name = "Duru" },
        new Brand { Id = 11, Name = "Solo" },
        new Brand { Id = 12, Name = "Hobby" }
    };

    private static List<Supplier> BuildSuppliers() => new()
    {
        new Supplier
        {
            Id = 1, Name = "Anadolu Gıda Dağıtım A.Ş.", ContactName = "Mehmet Yılmaz",
            Phone = "0212 555 1010", Email = "siparis@anadolugida.com.tr", City = "İstanbul"
        },
        new Supplier
        {
            Id = 2, Name = "Ege Toptan Ticaret Ltd. Şti.", ContactName = "Ayşe Demir",
            Phone = "0232 444 2020", Email = "info@egetoptan.com.tr", City = "İzmir"
        },
        new Supplier
        {
            Id = 3, Name = "Marmara Lojistik Dağıtım", ContactName = "Can Öztürk",
            Phone = "0216 333 3030", Email = "satis@marmaralojistik.com.tr", City = "İstanbul"
        },
        new Supplier
        {
            Id = 4, Name = "Başkent Tedarik A.Ş.", ContactName = "Zeynep Kaya",
            Phone = "0312 222 4040", Email = "destek@baskenttedarik.com.tr", City = "Ankara"
        },
        new Supplier
        {
            Id = 5, Name = "Çukurova Gıda Pazarlama", ContactName = "Emre Şahin",
            Phone = "0322 111 5050", Email = "pazarlama@cukurovagida.com.tr", City = "Adana"
        },
        new Supplier
        {
            Id = 6, Name = "Karadeniz Toptan Market", ContactName = "Elif Aydın",
            Phone = "0462 666 6060", Email = "iletisim@karadeniztoptan.com.tr", City = "Trabzon"
        }
    };

    private static List<Product> BuildProducts(List<Category> categories, List<Supplier> suppliers)
    {
        var categoryNames = categories.ToDictionary(c => c.Id, c => c.Name);
        var supplierNames = suppliers.ToDictionary(s => s.Id, s => s.Name);

        var now = DateTime.UtcNow;
        var createdStart = now.AddDays(-180);
        var products = new List<Product>(ProductRows.Length);

        for (var i = 0; i < ProductRows.Length; i++)
        {
            var row = ProductRows[i];
            var id = i + 1;

            products.Add(new Product
            {
                Id = id,
                Name = row.Name,
                Sku = row.Sku,
                Barcode = row.Barcode,
                ImageUrl = $"https://picsum.photos/seed/{id}/400/400",
                CategoryId = row.CategoryId,
                BrandId = row.BrandId,
                SupplierId = row.SupplierId,
                Price = row.Price,
                CostPrice = row.CostPrice,
                Stock = row.Stock,
                MinStock = row.MinStock,
                Unit = row.Unit,
                Status = row.Status,
                Description = $"{row.Name}. {categoryNames[row.CategoryId]} kategorisinde raf ürünü; " +
                              $"{supplierNames[row.SupplierId]} tarafından tedarik edilir.",
                IsFeatured = row.IsFeatured,
                CreatedAt = createdStart.AddDays(i * 2),
                // Güncelleme tarihleri yayılır ki sort=updatedAt anlamlı bir sonuç versin.
                UpdatedAt = now.AddDays(-((i * 13) % 60)).AddMinutes(-(i * 7))
            });
        }

        return products;
    }

    /// <summary>Ürün tohumlama tablosu. Fiyatlar KURUŞ cinsindendir (3950 = 39,50 TL).</summary>
    private static readonly (string Name, string Sku, string Barcode, int CategoryId, int BrandId, int SupplierId,
        int Price, int CostPrice, int Stock, int MinStock, ProductUnit Unit, ProductStatus Status, bool IsFeatured)[]
        ProductRows =
        {
            // --- İçecek ---
            ("Coca-Cola 1 L Pet", "ICE-1001", "8690637010011", 1, 6, 1, 3950, 2850, 240, 40, ProductUnit.Adet, ProductStatus.Aktif, true),
            ("Coca-Cola 2,5 L Pet", "ICE-1002", "8690637010028", 1, 6, 1, 6750, 5100, 180, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Coca-Cola Zero 330 ml Kutu", "ICE-1003", "8690637010035", 1, 6, 1, 2450, 1750, 0, 24, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Fanta Portakal 1 L Pet", "ICE-1004", "8690637010042", 1, 6, 1, 3750, 2700, 96, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Sprite 1 L Pet", "ICE-1005", "8690637010059", 1, 6, 1, 3750, 2700, 22, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Çaykur Rize Turist Çayı 1 Kg", "ICE-1006", "8690637010066", 1, 7, 2, 18900, 15200, 64, 15, ProductUnit.Kg, ProductStatus.Aktif, true),
            ("Çaykur Filiz Çay 500 g", "ICE-1007", "8690637010073", 1, 7, 2, 11500, 9200, 12, 15, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Doğadan Ihlamur 20'li Bardak Poşet", "ICE-1008", "8690637010080", 1, 8, 2, 4990, 3600, 140, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Doğadan Yeşil Çay Limonlu 20'li", "ICE-1009", "8690637010097", 1, 8, 2, 4750, 3400, 88, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Pınar Su 5 L Pet", "ICE-1010", "8690637010103", 1, 4, 3, 2990, 2100, 320, 60, ProductUnit.Adet, ProductStatus.Aktif, false),

            // --- Kahvaltılık ---
            ("Ülker Çikolatalı Fındık Kreması 400 g", "KAH-1011", "8690504010112", 2, 1, 1, 8950, 6900, 150, 30, ProductUnit.Adet, ProductStatus.Aktif, true),
            ("Ülker Süzme Bal 460 g", "KAH-1012", "8690504010129", 2, 1, 1, 13950, 11200, 48, 15, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Torku Banada Fındık Kreması 350 g", "KAH-1013", "8690637010134", 2, 3, 5, 8990, 6800, 72, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Torku Vişne Reçeli 380 g", "KAH-1014", "8690637010141", 2, 3, 5, 5450, 4100, 0, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Pınar Siyah Yağlı Zeytin 400 g", "KAH-1015", "8690526010158", 2, 4, 3, 11950, 9500, 66, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Pınar Kokteyl Sosis 300 g", "KAH-1016", "8690526010165", 2, 4, 3, 9750, 7600, 18, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Pınar Dana Salam 200 g", "KAH-1017", "8690526010172", 2, 4, 3, 8450, 6600, 92, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Sütaş Tereyağı 250 g", "KAH-1018", "8690506010189", 2, 5, 3, 13950, 11200, 55, 15, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Eti Sade Tahin Helvası 400 g", "KAH-1019", "8690526010196", 2, 2, 1, 9950, 7800, 120, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Doğadan Filtre Kahve 250 g", "KAH-1020", "8690637010202", 2, 8, 2, 15950, 12800, 34, 20, ProductUnit.Paket, ProductStatus.Aktif, false),

            // --- Temel Gıda ---
            ("Torku Toz Şeker 1 Kg", "TEM-1021", "8690637010219", 3, 3, 5, 4750, 3900, 400, 60, ProductUnit.Kg, ProductStatus.Aktif, false),
            ("Torku Küp Şeker 750 g", "TEM-1022", "8690637010226", 3, 3, 5, 5250, 4200, 165, 40, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Torku Burgu Makarna 500 g", "TEM-1023", "8690637010233", 3, 3, 5, 2290, 1650, 520, 80, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Torku Spagetti Makarna 500 g", "TEM-1024", "8690637010240", 3, 3, 5, 2290, 1650, 35, 80, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Torku Ayçiçek Yağı 5 L", "TEM-1025", "8690637010257", 3, 3, 5, 44900, 38500, 58, 12, ProductUnit.Lt, ProductStatus.Aktif, true),
            ("Torku Ayçiçek Yağı 1 L", "TEM-1026", "8690637010264", 3, 3, 5, 9750, 8200, 0, 30, ProductUnit.Lt, ProductStatus.Aktif, false),
            ("Torku Baldo Pirinç 1 Kg", "TEM-1027", "8690637010271", 3, 3, 2, 8950, 7100, 145, 25, ProductUnit.Kg, ProductStatus.Aktif, false),
            ("Torku Buğday Unu 2 Kg", "TEM-1028", "8690637010288", 3, 3, 2, 5450, 4300, 210, 40, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Torku Kırmızı Mercimek 1 Kg", "TEM-1029", "8690637010295", 3, 3, 5, 7250, 5800, 96, 25, ProductUnit.Kg, ProductStatus.Aktif, false),
            ("Torku Domates Salçası 700 g", "TEM-1030", "8690637010301", 3, 3, 5, 6950, 5400, 22, 25, ProductUnit.Adet, ProductStatus.Aktif, false),

            // --- Süt Ürünleri ---
            ("Pınar Tam Yağlı Süt 1 L", "SUT-1031", "8690526010318", 4, 4, 3, 3990, 3100, 260, 50, ProductUnit.Lt, ProductStatus.Aktif, true),
            ("Pınar Yarım Yağlı Süt 1 L", "SUT-1032", "8690526010325", 4, 4, 3, 3890, 3000, 175, 50, ProductUnit.Lt, ProductStatus.Aktif, false),
            ("Pınar Klasik Beyaz Peynir 500 g", "SUT-1033", "8690526010332", 4, 4, 3, 14900, 11800, 64, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Pınar Kaşar Peyniri 350 g", "SUT-1034", "8690526010349", 4, 4, 3, 16750, 13400, 0, 15, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Pınar Labne 180 g", "SUT-1035", "8690526010356", 4, 4, 3, 4950, 3700, 110, 25, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Sütaş Tam Yağlı Yoğurt 1 Kg", "SUT-1036", "8690506010363", 4, 5, 3, 6950, 5400, 145, 30, ProductUnit.Kg, ProductStatus.Aktif, true),
            ("Sütaş Ayran 1 L", "SUT-1037", "8690506010370", 4, 5, 3, 3450, 2600, 14, 30, ProductUnit.Lt, ProductStatus.Aktif, false),
            ("Sütaş Süzme Yoğurt 750 g", "SUT-1038", "8690506010387", 4, 5, 3, 7450, 5900, 88, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Sütaş Kaymak 150 g", "SUT-1039", "8690506010394", 4, 5, 3, 8950, 7100, 26, 15, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Torku Kaşar Peyniri 400 g", "SUT-1040", "8690637010400", 4, 3, 5, 15450, 12300, 40, 15, ProductUnit.Paket, ProductStatus.UretimDurduruldu, false),

            // --- Atıştırmalık ---
            ("Ülker Çikolatalı Gofret 36 g", "ATI-1041", "8690504010419", 5, 1, 1, 1250, 850, 480, 80, ProductUnit.Adet, ProductStatus.Aktif, true),
            ("Ülker Albeni 40 g", "ATI-1042", "8690504010426", 5, 1, 1, 1450, 1000, 360, 80, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Ülker Çokonat 33 g", "ATI-1043", "8690504010433", 5, 1, 1, 1350, 950, 0, 60, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Ülker Halley 6'lı Paket", "ATI-1044", "8690504010440", 5, 1, 1, 4990, 3700, 145, 30, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Ülker Metro 36 g", "ATI-1045", "8690504010457", 5, 1, 1, 1550, 1100, 45, 60, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Eti Cin Çilekli 40 g", "ATI-1046", "8690526010462", 5, 2, 1, 1150, 800, 275, 50, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Eti Popkek Kakaolu 45 g", "ATI-1047", "8690526010479", 5, 2, 1, 1650, 1200, 18, 40, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Eti Canga 45 g", "ATI-1048", "8690526010486", 5, 2, 1, 1750, 1250, 210, 40, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Eti Burçak Bisküvi 131 g", "ATI-1049", "8690526010493", 5, 2, 1, 2450, 1800, 190, 35, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Torku Bitter Çikolata %70 70 g", "ATI-1050", "8690637010509", 5, 3, 5, 3450, 2500, 130, 25, ProductUnit.Adet, ProductStatus.Pasif, false),

            // --- Temizlik ---
            ("Duru Bulaşık Deterjanı Limon 750 ml", "TMZ-1051", "8690637010516", 6, 10, 6, 5950, 4400, 8, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Yüzey Temizleyici Çam 1 L", "TMZ-1052", "8690637010523", 6, 10, 6, 6750, 5100, 95, 25, ProductUnit.Lt, ProductStatus.Aktif, false),
            ("Duru Çamaşır Suyu 1 L", "TMZ-1053", "8690637010530", 6, 10, 6, 3950, 2800, 220, 40, ProductUnit.Lt, ProductStatus.Aktif, false),
            ("Duru Arap Sabunu 750 ml", "TMZ-1054", "8690637010547", 6, 10, 6, 7950, 6100, 62, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Toz Çamaşır Deterjanı 6 Kg", "TMZ-1055", "8690637010554", 6, 10, 6, 32900, 26500, 44, 12, ProductUnit.Kg, ProductStatus.Aktif, true),
            ("Duru Yumuşatıcı Bahar 1440 ml", "TMZ-1056", "8690637010561", 6, 10, 4, 12950, 10100, 0, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Cam Temizleyici 750 ml", "TMZ-1057", "8690637010578", 6, 10, 6, 4450, 3200, 130, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Banyo Temizleyici 750 ml", "TMZ-1058", "8690637010585", 6, 10, 6, 5250, 3900, 24, 25, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Bulaşık Makinesi Tableti 60'lı", "TMZ-1059", "8690637010592", 6, 10, 4, 28900, 23200, 38, 10, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Duru Halı Şampuanı 1 L", "TMZ-1060", "8690637010608", 6, 10, 6, 8950, 6900, 0, 15, ProductUnit.Lt, ProductStatus.Pasif, false),

            // --- Kişisel Bakım ---
            ("Duru Yeşil Zeytinyağlı Sabun 4x150 g", "KIS-1061", "8690637010615", 7, 10, 6, 5950, 4300, 180, 30, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Duru Nemlendirici Duş Jeli 500 ml", "KIS-1062", "8690637010622", 7, 10, 6, 9950, 7700, 84, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Kepeğe Karşı Şampuan 600 ml", "KIS-1063", "8690637010639", 7, 10, 6, 12950, 10200, 15, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Duru Beyaz Sabun Sıvı Sabun 400 ml", "KIS-1064", "8690637010646", 7, 10, 6, 4750, 3400, 160, 30, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Hobby Beyazlatıcı Diş Macunu 100 ml", "KIS-1065", "8690637010653", 7, 12, 6, 6950, 5300, 145, 25, ProductUnit.Adet, ProductStatus.Aktif, true),
            ("Hobby Diş Fırçası Orta 2'li", "KIS-1066", "8690637010660", 7, 12, 6, 5450, 3900, 0, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Hobby Onarıcı Saç Kremi 400 ml", "KIS-1067", "8690637010677", 7, 12, 6, 10950, 8600, 58, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Hobby Traş Köpüğü 200 ml", "KIS-1068", "8690637010684", 7, 12, 6, 7450, 5700, 20, 20, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Hobby Nemlendirici El Kremi 75 ml", "KIS-1069", "8690637010691", 7, 12, 6, 4950, 3600, 210, 35, ProductUnit.Adet, ProductStatus.Aktif, false),
            ("Hobby Limon Kolonyası 400 ml", "KIS-1070", "8690637010707", 7, 12, 6, 5950, 4400, 95, 25, ProductUnit.Adet, ProductStatus.UretimDurduruldu, false),

            // --- Kâğıt Ürünleri ---
            ("Selpak Peçete 100'lü", "KAG-1071", "8690637010714", 8, 9, 4, 3450, 2500, 240, 40, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Selpak Islak Mendil 3x60", "KAG-1072", "8690637010721", 8, 9, 4, 6450, 4900, 20, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Selpak Tuvalet Kağıdı 32'li", "KAG-1073", "8690637010738", 8, 9, 4, 36900, 29500, 68, 15, ProductUnit.Paket, ProductStatus.Aktif, true),
            ("Selpak Kağıt Havlu 12'li", "KAG-1074", "8690637010745", 8, 9, 4, 19950, 15900, 92, 20, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Selpak Cep Mendili 10'lu", "KAG-1075", "8690637010752", 8, 9, 4, 2950, 2100, 0, 40, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Solo Tuvalet Kağıdı 16'lı", "KAG-1076", "8690637010769", 8, 11, 4, 18950, 15100, 120, 25, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Solo Kağıt Havlu 8'li", "KAG-1077", "8690637010776", 8, 11, 4, 13450, 10700, 165, 30, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Solo Peçete 150'li", "KAG-1078", "8690637010783", 8, 11, 4, 4250, 3100, 28, 30, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Solo Endüstriyel Havlu Rulo 2'li", "KAG-1079", "8690637010790", 8, 11, 4, 22950, 18400, 36, 10, ProductUnit.Paket, ProductStatus.Aktif, false),
            ("Solo Masa Örtüsü Rulo 20 m", "KAG-1080", "8690637010806", 8, 11, 4, 8950, 6800, 0, 10, ProductUnit.Adet, ProductStatus.Pasif, false)
        };
}
