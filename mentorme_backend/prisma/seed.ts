// // prisma/seedSubjects.ts
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   const subjects = [
//     "Toán Học",
//     "Văn Học",
//     "Tin Học",
//     "Tiếng Anh",
//     "Lịch Sử",
//     "Hóa Học",
//     "Vật Lý",
//     "Sinh Học",
//   ];

//   const levels = ["Cơ bản", "Nâng cao"];

//   for (const name of subjects) {
//     for (const level of levels) {
//       // Kiểm tra xem môn với level đó đã tồn tại chưa
//       const existing = await prisma.subject.findFirst({
//         where: { name, level },
//       });

//       if (!existing) {
//         await prisma.subject.create({
//           data: {
//             name,
//             level,
//             description: `${name} - ${level}`,
//           },
//         });
//         console.log(`Created subject: ${name} (${level})`);
//       } else {
//         console.log(`Subject already exists: ${name} (${level})`);
//       }
//     }
//   }
// }

// main()
//   .catch((e) => console.error(e))
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
