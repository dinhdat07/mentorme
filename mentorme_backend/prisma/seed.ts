import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSubjects() {
  const subjects = [
    {
      name: "Toán",
      level: "Tiểu học",
      description: "Toán cơ bản cho học sinh tiểu học",
    },
    {
      name: "Toán",
      level: "THCS",
      description: "Toán trung học cơ sở",
    },
    {
      name: "Toán",
      level: "THPT",
      description: "Toán trung học phổ thông",
    },
    {
      name: "Tiếng Anh",
      level: "Tiểu học",
      description: "Tiếng Anh thiếu nhi",
    },
    {
      name: "Tiếng Anh",
      level: "THCS",
      description: "Tiếng Anh trung học cơ sở",
    },
    {
      name: "Tiếng Anh",
      level: "THPT",
      description: "Tiếng Anh luyện thi",
    },
    {
      name: "Vật lý",
      level: "THPT",
      description: "Vật lý trung học phổ thông",
    },
    {
      name: "Hóa học",
      level: "THPT",
      description: "Hóa học trung học phổ thông",
    },
  ];

  for (const subject of subjects) {
    const exists = await prisma.subject.findFirst({
      where: {
        name: subject.name,
        level: subject.level,
      },
    });

    if (!exists) {
      await prisma.subject.create({
        data: subject,
      });
    }
  }

  console.log("✅ Seed subjects completed");
}

async function main() {
  // Nếu muốn xóa sạch trước khi seed
  // await prisma.subject.deleteMany();

  await seedSubjects();
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
