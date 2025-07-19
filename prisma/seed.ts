import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Specialty 생성
  const specialties = [
    { name: "내과", description: "내과 진료" },
    { name: "외과", description: "외과 진료" },
    { name: "치과", description: "치과 진료" },
    { name: "피부과", description: "피부과 진료" },
    { name: "안과", description: "안과 진료" },
    { name: "영상의학과", description: "영상의학과 진료" },
    { name: "재활의학과", description: "재활의학과 진료" }
  ];
  const specialtyRecords = await Promise.all(
    specialties.map(s => prisma.specialty.upsert({
      where: { name: s.name },
      update: {},
      create: s
    }))
  );

  // 2. Veterinarian 생성
  const vets = [
    { name: "김수의", license: "12345", profileImage: null },
    { name: "이수의", license: "23456", profileImage: null },
    { name: "박수의", license: "34567", profileImage: null },
    { name: "최수의", license: "45678", profileImage: null },
    { name: "정수의", license: "56789", profileImage: null },
    { name: "오수의", license: "67890", profileImage: null },
    { name: "한수의", license: "78901", profileImage: null },
    { name: "류수의", license: "89012", profileImage: null },
    { name: "문수의", license: "90123", profileImage: null },
    { name: "장수의", license: "01234", profileImage: null }
  ];
  const vetRecords = await Promise.all(
    vets.map(v => prisma.veterinarian.upsert({
      where: { name: v.name },
      update: {},
      create: v
    }))
  );

  // 3. Hospital 생성
  const hospitals = [
    {
      name: "서울동물메디컬센터",
      address: "서울특별시 강남구 테헤란로 123",
      phone: "02-123-4567",
      openHours: "09:00~18:00",
      description: "최신 장비와 전문 의료진이 진료하는 서울 대표 동물병원.",
      imageUrls: "https://placehold.co/200x200?text=서울동물메디컬센터,https://placehold.co/200x200?text=서울동물메디컬센터2",
      faq: "주차가능한가요?,네, 1시간 무료입니다./예약 없이 방문 가능한가요?,가능하지만 대기시간이 길 수 있습니다."
    },
    {
      name: "해피펫동물병원",
      address: "서울특별시 마포구 월드컵북로 456",
      phone: "02-234-5678",
      openHours: "10:00~20:00",
      description: "친절한 상담과 다양한 진료과목을 제공.",
      imageUrls: "https://placehold.co/200x200?text=해피펫동물병원",
      faq: "진료비는 얼마인가요?,진료과목별로 다릅니다."
    },
    {
      name: "우리동물메디컬센터",
      address: "부산광역시 해운대구 센텀중앙로 789",
      phone: "051-345-6789",
      openHours: "08:30~17:30",
      description: "부산 대표 동물병원.",
      imageUrls: "https://placehold.co/200x200?text=우리동물메디컬센터",
      faq: "응급진료 되나요?,24시간 응급진료 운영합니다."
    },
    {
      name: "펫케어동물병원",
      address: "대구광역시 수성구 동대구로 101",
      phone: "053-456-7890",
      openHours: "09:00~19:00",
      description: "재활의학과 전문.",
      imageUrls: "https://placehold.co/200x200?text=펫케어동물병원",
      faq: "재활치료 예약은 어떻게 하나요?,전화 또는 온라인 예약 가능합니다."
    },
    {
      name: "스마일동물병원",
      address: "인천광역시 남동구 예술로 202",
      phone: "032-567-8901",
      openHours: "10:00~21:00",
      description: "스마일과 친절을 약속하는 병원.",
      imageUrls: "https://placehold.co/200x200?text=스마일동물병원",
      faq: "치과 진료 예약 가능한가요?,네, 가능합니다."
    }
  ];
  const hospitalRecords = await Promise.all(
    hospitals.map(h => prisma.hospital.create({ data: h }))
  );

  // 4. 병원-진료과목 연결
  const hospitalSpecialties = [
    // 서울동물메디컬센터: 내과, 외과, 치과
    { hospital: hospitalRecords[0], specialties: ["내과", "외과", "치과"] },
    // 해피펫동물병원: 피부과, 안과
    { hospital: hospitalRecords[1], specialties: ["피부과", "안과"] },
    // 우리동물메디컬센터: 내과, 영상의학과
    { hospital: hospitalRecords[2], specialties: ["내과", "영상의학과"] },
    // 펫케어동물병원: 외과, 재활의학과
    { hospital: hospitalRecords[3], specialties: ["외과", "재활의학과"] },
    // 스마일동물병원: 치과, 내과
    { hospital: hospitalRecords[4], specialties: ["치과", "내과"] }
  ];
  for (const hs of hospitalSpecialties) {
    for (const sName of hs.specialties) {
      const specialty = specialtyRecords.find(s => s.name === sName);
      if (specialty) {
        await prisma.hospitalSpecialty.create({
          data: {
            hospitalId: hs.hospital.id,
            specialtyId: specialty.id
          }
        });
      }
    }
  }

  // 5. 병원-수의사 연결 (각 병원에 2명씩)
  const hospitalVets = [
    ["김수의", "이수의"],
    ["박수의", "최수의"],
    ["정수의", "오수의"],
    ["한수의", "류수의"],
    ["문수의", "장수의"]
  ];
  for (let i = 0; i < hospitalRecords.length; i++) {
    for (const vName of hospitalVets[i]) {
      const vet = vetRecords.find(v => v.name === vName);
      if (vet) {
        await prisma.hospitalVeterinarian.create({
          data: {
            hospitalId: hospitalRecords[i].id,
            veterinarianId: vet.id
          }
        });
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  }); 