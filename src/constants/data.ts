import { Project, Experience, TechStack, Certificate, Achievement } from '../types';

export const PROFILE_PHOTO = "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

export const AI_CHAT_CONTEXT = {
  introduction: "Hi! I'm Alyx's AI Assistant. I can help you learn more about Alief Akbar:",
  topics: [
    "Professional experience in Business Intelligence and Data Analysis",
    "Technical skills and projects",
    "Educational background and certifications",
    "Potential collaboration opportunities"
  ],
  suggestedQuestions: [
    "What are Alief's key skills in data analysis?",
    "Tell me about Alief's experience with BI tools",
    "What kind of projects has Alief worked on?",
    "Is Alief available for freelance work?"
  ]
};

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Sales Analysis Dashboard",
    description: "A dashboard analyzing sales data from a retail store. It includes key metrics such as total sales, top-selling products, and sales trends over time.",
    technologies: ["Looker", "BigQuery", "Apache"],
    image: "https://i.imgur.com/IiNRnsF.jpg",
    github: "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/Sales%20Analysis%20Dashboard",
    link: "-"
  },
  {
    id: 2,
    title: "Classification Form Upload",
    description: "A project that user segments based on their provinces behavior using classification clustering by their upload files.",
    technologies: ["MySQL 8.0", "React.JS", "Node.JS"],
    image: "https://i.imgur.com/aUBBSsZ.jpg",
    github: "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/Classification%20Form%20Upload",
    link: "-"
  },
  {
    id: 3,
    title: "NBA Player Stats Data Analysis 2023-2024",
    description: "A comprehensive dashboard for tracking cryptocurrency prices, trends, and portfolio performance with real-time updates.",
    technologies: ["Python (Jupyter Notebook)", "PostgreeSQL", "Spreadsheet"],
    image: "https://i.imgur.com/rMjzkvp.jpg",
    github: "https://github.com/AliveNata/Business-Intelligence-Portfolio/tree/main/BI%20Portofolio/NBA%20Player%20Stats%20Data%20Analysis%202023-2024",
    link: "-"
  },
  {
    id: 4,
    title: " eTicketing Web Based (Top Ticket)",
    description: "Creating a web-based eTicketing system aims to simplify, secure, and enhance efficiency in ticket sales for both large and small events. With features such as automation, QR code validation, analytics dashboard, and payment integration, the system can provide a better experience for both users and event organizers.",
    technologies: ["Laravel", "MySQL", "PHP", "CSS"],
    image: "https://i.imgur.com/Qcu0x2s.jpg",
    github: "https://github.com",
    link: "https://toptiket.my.id/"
  }
];

export const EXPERIENCES: Experience[] = [
  {
    id: 1,
    role: "Regional Business Intelligence Analyst",
    company: "Intrepid Group Asia",
    duration: "Jan 2022 - Oct 2024",
    description: [
      "Develop and manage BI strategies and projects",
      "Cross-departmental collaboration and reporting",
      "Standardization and optimization of data models"
    ],
    technologies: ["BigQuery", "AppScript", "Python", "Looker", "Apache", "Spreadsheet", "CRM Tools", "Project Management Tools"],
    type: 'it'
  },
  {
    id: 2,
    role: "Business & Data Analyst",
    company: "Fabelio Projects",
    duration: "Dec 2019 - Jan 2022",
    description: [
      "Build and manage business flow and data warehouse",
      "Data presentation and reporting",
      "Visualization development and data integration"
    ],
    technologies: ["BigQuery", "AppScript", "Python", "Looker", "Google Analytics", "Spreadsheet", "CRM Tools", "Project Management Tools"],
    type: 'it'
  },
  {
    id: 3,
    role: "IT Management Information System",
    company: "PT. Suzuki Finance Indonesia",
    duration: "Oct 2018 - Dec 2019",
    description: [
      "Creating reports to system with query in SQL server, manage trigger jobs, store procedures and schedulers data",
      "Developed report into app or email",
      "Development business requirements from request user, analyst data for board of directors"
    ],
    technologies: ["HTML/CSS", "C++", "SQL Server", "SSRS", "SSIS", "Excel"],
    type: 'it'
  },
  {
    id: 4,
    role: "IT Quality Assurance Manual",
    company: "PT. Suzuki Finance Indonesia",
    duration: "Mar 2018 - Oct 2018",
    description: [
      "Test Planning and Quality Assurance",
      "Validation and Compliance Testing",
      "Backend Testing and Deployment"
    ],
    technologies: ["SQL Server", "SSMS", "Selenium", "Jira", "Postman", "Excel"],
    type: 'it'
  },
  {
    id: 5,
    role: "Social Media Specialist",
    company: "PT Kudo Teknologi Indonesia (KUDO)",
    duration: "Feb 2016 - Dec 2017",
    description: [
      "Handling Agent Issues on Social Media",
      "Escalation to IT Helpdesk Team",
      "Bridge Between Digital Marketing and Users"
    ],
    type: 'non-it'
  },
  {
    id: 6,
    role: "Customer Loyalty",
    company: "Zalora Indonesia",
    duration: "Nov 2014 - Jul 2015",
    description: [
      "Customer Transaction Support",
      "Logistics Coordination and Follow-up",
      "Customer Engagement and Voucher Distribution"
    ],
    type: 'non-it'
  },
  {
    id: 7,
    role: "Technician Support 'Apple Service Provider'",
    company: "eStore",
    duration: "Jan 2013 - Aug 2013",
    description: [
      "Technical Support for Apple Devices",
      "Hardware and Software Services",
      "Consultation and Product Reservations"
    ],
    type: 'non-it'
  },
  {
    id: 8,
    role: "HRIS Staff",
    company: "TVRI Nasional",
    duration: "May 2012 - Jul 2012",
    description: [
      "Employee Data Management with Haermes HRMS",
      "Payroll System Integration",
      "Internship Program Coordination"
    ],
    type: 'non-it'
  },
  {
    id: 9,
    role: "Waiter",
    company: "Benihana Restaurant",
    duration: "Jul 2011 - Mar 2012",
    description: [
      "Teppan and À la Carte Service",
      "Event Support and Food Running",
      "Order Entry and System Management"
    ],
    type: 'non-it'
  }
];

export const TECH_STACK: TechStack[] = [
  {
    category: "All Technologies",
    items: [
      { name: "PostgreSQL", icon: "database", color: "#336791" },
      { name: "BigQuery", icon: "databaseBackup", color: "#FFFFFF" },
      { name: "MySQL", icon: "database", color: "#DC382D" },
      { name: "Apache", icon: "fan", color: "#FF9900" },
      { name: "Formula", icon: "radical", color: "#C21325" },
      { name: "Looker", icon: "bookCheck", color: "#FFCA28" },
      { name: "Tableau", icon: "fileText", color: "#339933" },
      { name: "Power BI", icon: "fileCode", color: "#E535AB" },
      { name: "Python", icon: "braces", color: "#336791" },
      { name: "VS Code", icon: "code2", color: "#007ACC" },
      { name: "React", icon: "react", color: "#61DAFB" },
      { name: "TypeScript", icon: "fileType", color: "#3178C6" },
      { name: "JavaScript", icon: "fileCode", color: "#F7DF1E" },
      { name: "HTML", icon: "code", color: "#E34F26" },
      { name: "CSS", icon: "palette", color: "#1572B6" },
      { name: "Tailwind", icon: "wind", color: "#38B2AC" },
      { name: "Node.js", icon: "server", color: "#339933" },
      { name: "Express", icon: "serverCog", color: "#000000" },
      { name: "MongoDB", icon: "databaseZap", color: "#47A248" },
      { name: "Git", icon: "gitBranch", color: "#F05032" },
      { name: "Figma", icon: "figma", color: "#F24E1E" },
    ]
  }
];

export const ABOUT_ME = {
  title: "About Me",
  description: [
    "Hi, I'm Aliv, a data professional with 6+ years of experience turning complex data into sharp, actionable business strategies. Proven track record in enabling smarter decision-making through powerful data visualizations, in-depth analysis, and interactive dashboards.",
    "Proficient in a wide range of tools and technologies including ETL & BI tools, SQL, NoSQL, Python, Excel/Google Sheets, Jupyter Notebook, Data Visualization, Automated Reporting, and various CRM & Project Management tools such as Trello, Zendesk, Notion, Monday.com, Asana, and Jira.",
    "I've worked across industries and with regional teams to deliver impactful, data-driven solutions that truly make a difference.",
    "Interested in collaborating or chatting about anything data-related? Feel free to connect and drop me a DM."
  ],
  interests: ["Business Intelligence", "Artificial Intelligence", "Analysist, Scientist and Engineer", "Web Development", "Machine Learning"]
};

export const CERTIFICATES: Certificate[] = [
  {
    id: 1,
    title: "R Fundamental for Data Science",
    description: "Professional certification in R for Data Science",
    issuer: "DQLab",
    date: "2021",
    animation: "https://assets2.lottiefiles.com/packages/lf20_w51pcehl.json",
    link: "https://academy.dqlab.id/certificate/pdf/DQLABINTR1WKRBWW"
  },
  {
    id: 2,
    title: "Basic Data Visualization using Google Sheet",
    description: "Basic Formula techniques for data visualization for analysis and business intelligence applications",
    issuer: "Glints",
    date: "2020",
    animation: "https://assets5.lottiefiles.com/packages/lf20_qp1q7mct.json",
    link: "https://glints-dashboard.s3.ap-southeast-1.amazonaws.com/expert-class-certificates/alief-akbar-online-glintsexpertclass-data-visualization-series-i-basic-data-visualization-using-google-sheet-certificate-20200823-060000.pdf"
  },
  {
    id: 3,
    title: "Python Fundamental for Data Science",
    description: "Professional certification in Python for Data Science",
    issuer: "DQLab",
    date: "2025",
    animation: "https://assets8.lottiefiles.com/packages/lf20_2znxgjyt.json",
    link: "https://academy.dqlab.id/"
  }
];

export const ACHIEVEMENTS: Achievement[] = [
   {
    id: 1,
    title: "Data Visualization Expert",
    description: "Created impactful dashboards that improved data accessibility across 5 departments",
    animation: "https://assets2.lottiefiles.com/packages/lf20_puciaact.json",
    metrics: [
      { icon: "award", text: "Best Dashboard Design" },
      { icon: "building", text: "Intrepid Group Asia" },
      { icon: "medal", text: "Cross-Department Impact" }
    ]
  },
  {
    id: 2,
    title: "Q2 2020 Top Performers",
    description: "Recognized for outstanding contribution in implementing data-driven solutions in Fabelio Projects",
    animation: "https://assets4.lottiefiles.com/packages/lf20_touohxv0.json",
    metrics: [
      { icon: "award", text: "Best Data Initiative 2022" },
      { icon: "building", text: "Fabelio Projects" },
      { icon: "medal", text: "Team Excellence Award" }
    ]
  },
  {
    id: 3,
    title: "Mentoring Formula Class",
    description: "Reduced support requests for formula issues by training teams through a structured Formula Class program",
    animation: "https://assets3.lottiefiles.com/packages/lf20_hxart9lz.json",
    metrics: [
      { icon: "award", text: "Formula Class Initiatives" },
      { icon: "building", text: "Fabelio Projects" },
      { icon: "medal", text: "Internal Team Impact" }
    ]
  }
];