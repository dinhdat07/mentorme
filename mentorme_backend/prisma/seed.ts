import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs"; // <--- THÊM DÒNG NÀY

const prisma = new PrismaClient();

async function seedSubjects() {
  // SỬA Ở ĐÂY: Thay đổi 'name' để không bị trùng nhau
  const subjects = [
    {
      name: "Toán (Tiểu học)", // Đã sửa tên khác đi
      level: "Tiểu học",
      description: "Toán cơ bản cho học sinh tiểu học",
    },
    {
      name: "Toán (THCS)", // Khác với tên ở trên -> OK
      level: "THCS",
      description: "Toán trung học cơ sở",
    },
    {
      name: "Toán (THPT)", // Khác tên -> OK
      level: "THPT",
      description: "Toán trung học phổ thông",
    },
    {
      name: "Tiếng Anh (Tiểu học)",
      level: "Tiểu học",
      description: "Tiếng Anh thiếu nhi",
    },
    {
      name: "Tiếng Anh (THCS)",
      level: "THCS",
      description: "Tiếng Anh trung học cơ sở",
    },
    {
      name: "Tiếng Anh (THPT)",
      level: "THPT",
      description: "Tiếng Anh luyện thi",
    },
    {
      name: "Vật lý (THPT)",
      level: "THPT",
      description: "Vật lý trung học phổ thông",
    },
    {
      name: "Hóa học (THPT)",
      level: "THPT",
      description: "Hóa học trung học phổ thông",
    },
  ];

  for (const subject of subjects) {
    // Logic tìm kiếm cũng cần sửa lại một chút cho chắc chắn
    // Tuy nhiên vì name đã unique, chỉ cần tìm theo name là đủ
    const exists = await prisma.subject.findUnique({
      where: {
        name: subject.name,
      },
    });

    if (!exists) {
      await prisma.subject.create({ data: subject });
    }
  }

  console.log("✅ Seed subjects completed");
}

async function seedUsers() {
  // 2. Tạo mã hash cho mật khẩu "admin123"
  // Salt rounds thường là 10
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Admin
  const adminEmail = "admin@example.com";

  // Xóa user cũ đi để tạo lại cho chắc ăn (vì user cũ đang lưu pass sai)
  await prisma.user.deleteMany({ where: { email: adminEmail } });

  await prisma.user.create({
    data: {
      fullName: "Admin System",
      email: adminEmail,
      role: UserRole.ADMIN,
      passwordHash: hashedPassword, // 3. Lưu mật khẩu đã mã hóa
    },
  });
}

async function main() {
  await seedSubjects();
  await seedUsers();
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
