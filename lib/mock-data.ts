export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: "Active" | "Inactive";
  lastOrder: string;
};

export type Lead = {
  id: string;
  name: string;
  source: string;
  email: string;
  stage: "New" | "Qualified" | "Proposal";
  estimatedValue: string;
};

export type Task = {
  id: string;
  title: string;
  owner: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In progress" | "Done";
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export const dashboardStats = [
  { id: "customers", label: "Total Customers", value: "248", change: "+12 this month" },
  { id: "leads", label: "Active Leads", value: "36", change: "8 need follow-up" },
  { id: "tasks", label: "Pending Tasks", value: "12", change: "3 due today" },
  { id: "revenue", label: "Monthly Revenue", value: "$48,200", change: "+9.4% vs last month" },
] as const;

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    title: "New customer added",
    detail: "Northwind Labs was added to the customer list.",
    time: "12 minutes ago",
  },
  {
    id: "a2",
    title: "Lead qualified",
    detail: "Priya Shah moved from New to Qualified.",
    time: "1 hour ago",
  },
  {
    id: "a3",
    title: "Task completed",
    detail: "Send Q3 proposal to Harbor Goods.",
    time: "3 hours ago",
  },
  {
    id: "a4",
    title: "Invoice marked paid",
    detail: "Invoice #1042 from Cedar & Co. was paid.",
    time: "Yesterday",
  },
  {
    id: "a5",
    title: "Follow-up scheduled",
    detail: "Call with Atlas Retail is set for Thursday.",
    time: "Yesterday",
  },
];

export const monthlyRevenue = [
  { month: "Mar", value: 31200 },
  { month: "Apr", value: 35800 },
  { month: "May", value: 34100 },
  { month: "Jun", value: 40200 },
  { month: "Jul", value: 44100 },
  { month: "Aug", value: 48200 },
];

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Amelia Chen",
    company: "Harbor Goods",
    email: "amelia@harborgoods.example",
    status: "Active",
    lastOrder: "Aug 18, 2026",
  },
  {
    id: "c2",
    name: "Marcus Hale",
    company: "Cedar & Co.",
    email: "marcus@cedarco.example",
    status: "Active",
    lastOrder: "Aug 12, 2026",
  },
  {
    id: "c3",
    name: "Sofia Alvarez",
    company: "Northwind Labs",
    email: "sofia@northwind.example",
    status: "Active",
    lastOrder: "Aug 4, 2026",
  },
  {
    id: "c4",
    name: "Jonah Wright",
    company: "Atlas Retail",
    email: "jonah@atlasretail.example",
    status: "Inactive",
    lastOrder: "Jun 29, 2026",
  },
  {
    id: "c5",
    name: "Leila Rahman",
    company: "Brightline Studio",
    email: "leila@brightline.example",
    status: "Active",
    lastOrder: "Jul 30, 2026",
  },
];

export const leads: Lead[] = [];

export const tasks: Task[] = [
  {
    id: "t1",
    title: "Follow up with Priya Shah",
    owner: "You",
    due: "Today",
    priority: "High",
    status: "Pending",
  },
  {
    id: "t2",
    title: "Prepare August revenue summary",
    owner: "You",
    due: "Tomorrow",
    priority: "Medium",
    status: "In progress",
  },
  {
    id: "t3",
    title: "Renew Harbor Goods contract",
    owner: "Alex Kim",
    due: "Aug 28",
    priority: "High",
    status: "Pending",
  },
  {
    id: "t4",
    title: "Onboard Northwind Labs",
    owner: "Alex Kim",
    due: "Sep 2",
    priority: "Low",
    status: "In progress",
  },
];
