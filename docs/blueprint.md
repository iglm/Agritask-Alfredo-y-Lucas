# **App Name**: AgriTask Master

## Core Features:

- Lot Management: Create, read, update, and delete land lot records including ID, Name, Area, Location, and Technical Notes. Supports filtering by location.
- Staff Management: Manage worker database with attributes like ID, Name, Contact, Employment Type, and Base Daily Rate. Supports filtering by contract type.
- Task Planning: Schedule tasks, assign workers and lots, track progress with a dynamic slider (0-100%), and automatically calculate planned vs. actual costs based on progress. Allows filtering by task category.
- Intelligent Dashboard: Display KPIs such as total lots, accumulated planned costs, actual costs, and average efficiency, along with comparative bar graphs for planned vs. executed investment per lot and distribution of tasks by category.
- Interactive Calendar: Monthly calendar view of scheduled tasks with direct link to new task form with pre-filled date upon clicking a calendar date.
- Data Interoperability: Support exporting full listings in CSV/Excel format and importing via public Google Sheets links to streamline data migration to Firestore.
- Anomaly Detection Tool: An AI-powered tool analyzes task progress data in real time, proactively identifying and flagging potential anomalies, delays, or budget overruns to ensure projects stay on track and within financial parameters.

## Style Guidelines:

- Primary color: Forest Green (#388E3C) for positive actions, reflecting the 'Agro-Professional' identity.
- Background color: Desaturated forest green (#D3E4D3) to complement the primary color.
- Accent color: Earth Brown (#A1887F) for secondary elements.
- Body and headline font: 'PT Sans' (sans-serif), chosen for high readability on mobile devices in sunlight. Note: currently only Google Fonts are supported.
- Mobile-first adaptable design with a collapsible sidebar on mobile devices and header optimized to avoid smartphone 'Notch'.
- Utilize clear, professional icons from Lucide React to represent different agricultural tasks and management functions.
- Subtle transitions and animations for state changes and data updates to enhance user experience without being distracting.