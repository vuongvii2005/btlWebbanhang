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
    id: 13,
    status: 1,
    title: 'Nạc nọng heo nướng kèm xôi trắng (500gr)',
    category: 'Món mặn',
    img: './assets/img/products/nac-nong-heo-nuong-kem-xoi-trang.jpeg',
    price: 300000,
    desc: 'Nọng heo - phần thịt ngon nhất trên thủ heo, với những dải thịt nạc mỡ đan xen, mỗi thủ chỉ có được 1-2kg thịt nọng ngon mềm như vậy. Bếp trưởng Bếp Hoa tẩm ướp thật ngấm gia vị, nướng thẳng trên than hoa thơm nức, xém cạnh đẹp mắt. Miếng thịt nướng xong gắp khỏi vỉ vẫn thấy mỡ thơm còn sôi trên dải thịt, để thịt nghỉ vài phút khi thái ra óng ánh nước, gắp miếng thịt chấm với nước sốt siêu ngon độc quyền của Bếp, ngon đến tứa nước miếng, tranh nhau gắp sạch đĩa'
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
    id: 16,
    status: 1,
    title: 'Chè hương cốm lá dứa',
    category: 'Món tráng miệng',
    img: './assets/img/products/che-com-la-dua.jpeg',
    price: 60000,
    desc: 'Chè cốm hương lá dứa dẻo thơm, ngọt dịu, từng hạt cốm thoảng thoảng đâu đó hương lá dứa mát lành'
  },
  {
    id: 17,
    status: 1,
    title: 'Bánh bông lan chanh dây',
    category: 'Món tráng miệng',
    img: './assets/img/products/banh-bong-lan-chanh-day.jpeg',
    price: 50000,
    desc: 'Bánh bông lan chanh dây với vị chua nhẹ, không bị ngọt gắt hẳn sẽ là sự lựa chọn hoàn hảo'
  },
  {
    id: 18,
    status: 1,
    title: 'Chè bưởi',
    category: 'Món tráng miệng',
    img: './assets/img/products/che-buoi.jpeg',
    price: 50000,
    desc: 'Chè bưởi rất dễ ăn bởi hương vị ngọt mát, thơm ngon, vị bùi bùi của đậu xanh, giòn sần sật của cùi bưởi mà không hề bị đắng'
  },
  {
    id: 19,
    status: 1,
    title: 'Nước ép dâu tây',
    img: './assets/img/products/nuoc-ep-dau-tay.jpg',
    category: 'Nước uống',
    price: 100000,
    desc: 'Dâu tây ăn nguyên quả ngon ngọt, có cả quả dôn dốt chua, màu đỏ mọng trông cực yêu. Không chỉ ngon miệng mà đồ uống từ dâu tây còn có công dụng bảo vệ sức khỏe, sáng mắt, đẹp da, thon gọn vóc dáng. Làm giảm nguy cơ mắc bệnh về mỡ máu, chống viêm,…'
  },
  {
    id: 20,
    status: 1,
    title: 'Nước lọc',
    img: './assets/img/products/lavie-500ml-chai-moi-2.jpg',
    category: 'Nước uống',
    price: 5000,
    desc: 'Nước lọc'
  }
];
