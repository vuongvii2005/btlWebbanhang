const productsData = [
  { 
    id: 1, status: 1, 
    title: 'Nấm đùi gà xào cháy tỏi', 
    img: './assets/img/products/nam-dui-ga-chay-toi.jpeg', 
    category: 'Món mặn', 
    price: 200000,
    desc: 'Nấm đùi gà giòn ngọt được xào cùng tỏi thơm lừng, tạo hương vị đậm đà hấp dẫn.'
  },
  { 
    id: 2, status: 1, 
    title: 'Rau xào ngũ sắc', 
    img: './assets/img/products/rau-xao-ngu-sac.png', 
    category: 'Món mặn', 
    price: 180000,
    desc: 'Món rau xào tổng hợp với nhiều loại rau củ tươi ngon, giữ nguyên vị ngọt tự nhiên và màu sắc bắt mắt.'
  },
  { 
    id: 3, status: 1, 
    title: 'Bánh lava phô mai nướng', 
    img: './assets/img/products/banh_lava_pho_mai_nuong.jpeg', 
    category: 'Món mặn', 
    price: 180000,
    desc: 'Bánh nướng giòn tan bên ngoài, nhân phô mai chảy mềm mịn, béo ngậy và thơm lừng khi cắn vào.'
  },
  { 
    id: 4, status: 1, 
    title: 'Set lẩu thái Tomyum', 
    img: './assets/img/products/lau_thai.jpg', 
    category: 'Món mặn', 
    price: 699000,
    desc: 'Lẩu Thái Tomyum chua cay đặc trưng, kết hợp hải sản tươi sống và rau củ phong phú, chuẩn vị Thái Lan.'
  },
  { 
    id: 5, status: 1, 
    title: 'Cơm chiên cua', 
    img: './assets/img/products/com_chien_cua.png', 
    category: 'Món mặn', 
    price: 280000,
    desc: 'Cơm chiên vàng óng, hạt tơi đều, hòa quyện cùng thịt cua tươi và trứng thơm béo hấp dẫn.'
  },
  { 
    id: 6, status: 1, 
    title: 'Súp bào ngư hải sâm (1 phần)', 
    img: './assets/img/products/sup-bao-ngu-hai-sam.jpeg', 
    category: 'Món mặn', 
    price: 540000,
    desc: 'Súp cao cấp kết hợp bào ngư, hải sâm và nấm đông cô, bổ dưỡng và sang trọng, rất tốt cho sức khỏe.'
  },
  { 
    id: 7, status: 1, 
    title: 'Tai cuộn lưỡi', 
    img: './assets/img/products/tai-cuon-luoi.jpeg', 
    category: 'Món mặn', 
    price: 340000,
    desc: 'Tai heo và lưỡi heo được luộc chín, thái mỏng cuộn lại cùng gia vị, tạo nên món ăn giòn sần sật, đậm vị.'
  },
  { 
    id: 8, status: 1, 
    title: 'Xíu mại tôm thịt 10 viên', 
    img: './assets/img/products/xiu_mai_tom_thit_10_vien.jpg', 
    category: 'Món mặn', 
    price: 140000,
    desc: 'Món dimsum truyền thống với nhân tôm thịt tươi, gói trong lớp bột mỏng và hấp chín mềm, thơm phức.'
  },
  { 
    id: 9, status: 1, 
    title: 'Trà phô mai kem sữa', 
    img: './assets/img/products/tra-pho-mai-kem-sua.jpg', 
    category: 'Nước uống', 
    price: 34000,
    desc: 'Trà đậm đà kết hợp lớp kem phô mai béo mịn, ngọt nhẹ và mặn mà, tạo cảm giác khó quên.'
  },
  { 
    id: 10, status: 1, 
    title: 'Trà đào chanh sả', 
    img: './assets/img/products/tra-dao-chanh-sa.jpg', 
    category: 'Nước uống', 
    price: 25000,
    desc: 'Trà đào thanh mát kết hợp chanh và sả thơm dịu, mang đến cảm giác sảng khoái tức thì.'
  },
  { 
    id: 11, status: 1, 
    title: 'Bánh chuối nướng', 
    img: './assets/img/products/banh-chuoi-nuong.jpeg', 
    category: 'Món tráng miệng', 
    price: 60000,
    desc: 'Bánh chuối thơm lừng, nướng vàng mặt, bên trong mềm mịn và ngọt dịu tự nhiên của chuối chín.'
  },
  { 
    id: 12, status: 1, 
    title: 'Há cảo sò điệp (10 viên)', 
    img: './assets/img/products/ha_cao.jpg', 
    category: 'Món mặn', 
    price: 140000,
    desc: 'Há cảo hấp nhân sò điệp tươi ngon, vỏ bánh trong suốt, dai nhẹ, vị ngọt thanh hấp dẫn.'
  },
  { 
    id: 13, status: 1, 
    title: 'Chả rươi (100gr)', 
    img: './assets/img/products/thit_nuong.jpg', 
    category: 'Món mặn', 
    price: 60000,
    desc: 'Chả rươi đặc sản Hà Nội, thơm béo đặc trưng, chiên vàng giòn, dùng kèm rau sống và nước mắm chua ngọt.'
  },
  { 
    id: 14, status: 1, 
    title: 'Nộm gà Hội An (1 phần)', 
    img: './assets/img/products/nom_ga_hoi_an.png', 
    category: 'Món mặn', 
    price: 60000,
    desc: 'Gà xé trộn cùng bắp cải, hành tây, rau răm và nước mắm chua ngọt, tạo nên hương vị thanh nhẹ và hấp dẫn.'
  },
  { 
    id: 15, status: 1, 
    title: 'Set bún cá (1 set 5 bát)', 
    img: './assets/img/products/set_bun_ca.jpg', 
    category: 'Món mặn', 
    price: 60000,
    desc: 'Bún cá tươi ngon, nước dùng thanh ngọt, ăn kèm rau sống và ớt tươi đúng chuẩn hương vị truyền thống.'
  },
  { 
    id: 16, status: 1, 
    title: 'Xôi xéo', 
    img: './assets/img/products/xoi-xeo.png', 
    category: 'Món mặn', 
    price: 60000,
    desc: 'Xôi nếp vàng óng ăn cùng đậu xanh nghiền nhuyễn và hành phi thơm giòn, món ăn sáng quen thuộc của người Việt.'
  }
];
