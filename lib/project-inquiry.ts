export type ProjectInquiry = {
  name: string;
  email: string;
  phone: string;
  profession: string;
  currentCity: string;
  currentCountry: string;
  originCity: string;
  originCountry: string;
  projectType: string;
  projectDescription: string;
  requirements: string;
  desiredFeatures: string;
  otherDetails: string;
};

export const emptyProjectInquiry: ProjectInquiry = {
  name: "",
  email: "",
  phone: "",
  profession: "",
  currentCity: "",
  currentCountry: "",
  originCity: "",
  originCountry: "",
  projectType: "",
  projectDescription: "",
  requirements: "",
  desiredFeatures: "",
  otherDetails: "",
};

export type InquiryField = keyof ProjectInquiry;

export const inquiryFields: InquiryField[] = [
  "name",
  "email",
  "phone",
  "profession",
  "currentCity",
  "currentCountry",
  "originCity",
  "originCountry",
  "projectType",
  "projectDescription",
  "requirements",
  "desiredFeatures",
  "otherDetails",
];

export const requiredInquiryFields: InquiryField[] = [
  "name",
  "email",
  "phone",
  "profession",
  "currentCity",
  "currentCountry",
  "projectType",
  "projectDescription",
];

export const whatsappDestination = "963959602775";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /[+\d][\d\s().-]{6,}/;

export function validateProjectInquiry(inquiry: Partial<ProjectInquiry>) {
  const errors: Partial<Record<InquiryField, string>> = {};
  for (const field of requiredInquiryFields) {
    if (!inquiry[field]?.trim()) errors[field] = "This field is required.";
  }
  if (inquiry.email?.trim() && !emailPattern.test(inquiry.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (inquiry.phone?.trim() && !phonePattern.test(inquiry.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }
  return errors;
}

export function isCompleteProjectInquiry(inquiry: ProjectInquiry) {
  return Object.keys(validateProjectInquiry(inquiry)).length === 0;
}

export function inquiryFieldLabel(field: InquiryField, arabic: boolean) {
  const labels: Record<InquiryField, [string, string]> = {
    name: ["full name", "الاسم الكامل"],
    email: ["best email address", "الإيميل الأفضل للتواصل"],
    phone: ["phone number", "رقم الهاتف"],
    profession: ["profession or occupation", "المهنة أو مجال العمل"],
    currentCity: ["city", "المدينة"],
    currentCountry: ["country", "الدولة"],
    originCity: ["city of origin, if relevant", "مدينة الأصل إذا كانت مهمة"],
    originCountry: ["country of origin, if relevant", "دولة الأصل إذا كانت مهمة"],
    projectType: ["kind of project", "نوع المشروع"],
    projectDescription: ["a short description of the project", "وصف مختصر للمشروع"],
    requirements: ["the main requirements", "المتطلبات الأساسية"],
    desiredFeatures: ["the features you would like", "الميزات التي تريدها"],
    otherDetails: ["any other useful project details", "أي تفاصيل أخرى مفيدة عن المشروع"],
  };
  return labels[field][arabic ? 1 : 0];
}

export function nextInquiryField(inquiry: ProjectInquiry): InquiryField | null {
  for (const field of inquiryFields) {
    if (!inquiry[field].trim() && field !== "originCity" && field !== "originCountry" && field !== "requirements" && field !== "desiredFeatures" && field !== "otherDetails") {
      return field;
    }
  }
  return null;
}

export function inquirySummary(inquiry: ProjectInquiry, arabic: boolean) {
  const origin = [inquiry.originCity, inquiry.originCountry].filter(Boolean).join(", ") || (arabic ? "غير محدد" : "Not specified");
  const location = [inquiry.currentCity, inquiry.currentCountry].filter(Boolean).join(", ");
  return arabic
    ? `الاسم: ${inquiry.name}\nالإيميل: ${inquiry.email}\nالهاتف: ${inquiry.phone}\nالمهنة: ${inquiry.profession}\nالموقع الحالي: ${location}\nالأصل: ${origin}\nنوع المشروع: ${inquiry.projectType}\nالوصف: ${inquiry.projectDescription}\nالمتطلبات: ${inquiry.requirements || "غير محددة"}\nالميزات: ${inquiry.desiredFeatures || "غير محددة"}\nتفاصيل إضافية: ${inquiry.otherDetails || "لا يوجد"}`
    : `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nProfession: ${inquiry.profession}\nCurrent location: ${location}\nOrigin: ${origin}\nProject type: ${inquiry.projectType}\nDescription: ${inquiry.projectDescription}\nRequirements: ${inquiry.requirements || "Not specified"}\nDesired features: ${inquiry.desiredFeatures || "Not specified"}\nOther details: ${inquiry.otherDetails || "None"}`;
}

export function buildWhatsAppMessage(inquiry: ProjectInquiry) {
  const lines = [
    "🚀 New Project Inquiry - Adnan Portfolio",
    "",
    "Client Information",
    "------------------",
    [
      ["Name", inquiry.name],
      ["Email", inquiry.email],
      ["Phone", inquiry.phone],
      ["Profession", inquiry.profession],
      ["Current City", inquiry.currentCity],
      ["Current Country", inquiry.currentCountry],
      ["Origin City", inquiry.originCity],
      ["Origin Country", inquiry.originCountry],
    ],
    "",
    "Project Information",
    "-------------------",
    [
      ["Project Type", inquiry.projectType],
      ["Project Description", inquiry.projectDescription],
      ["Requirements", inquiry.requirements],
      ["Desired Features", inquiry.desiredFeatures],
      ["Other Details", inquiry.otherDetails],
    ],
    "",
    "Source: Adnan Portfolio AI",
  ]
    .flatMap((part) => {
      if (!Array.isArray(part)) return [part];
      return part.filter(([, value]) => value.trim()).map(([label, value]) => `${label}: ${value}`);
    })
    .join("\n");

  return `https://wa.me/${whatsappDestination}?text=${encodeURIComponent(lines)}`;
}
