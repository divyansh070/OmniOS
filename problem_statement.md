P R O B L E M S T A T E M E N T 1

Unified Campus Intelligence
Dashboard with AI Assistant

T H E P R O B L E M
College campuses have data scattered everywhere: the
library uses one legacy portal, the cafeteria menu is a
PDF on a website, club events are on Google
Calendars, and academic handbooks are massive
PDFs. Students waste time digging through 5 different
systems just to find out if a book is available or what
time a tech fest workshop starts.

2 T H E S O L U T I O N
Build a Unified Web Dashboard featuring an embedded
AI Assistant. Instead of building massive, brittle web
scrapers that dump everything into one giant
database, students will build independent MCP (Model
Context Protocol) Servers for each campus data
source. The AI will dynamically query these servers in
real-time based on what the student asks.

3K E Y F E A T U R E S
Independent MCP Servers for distinct campus data
sources (library, cafeteria, events, academics, etc.).
—
AI Assistant that routes natural-language queries to
the appropriate MCP server(s) in real-time.
—
Unified dashboard UI that surfaces results from
multiple sources in one view.
—
No single giant database — data is fetched live
from each source server.
—
(Optional) Authentication / personalization for
students.


LAYER       S U G G E S T E D T E C H N O L O G I E S
Frontend React.js or Next.js
Backend / MCP
Servers Node.js or Python (FastAPI /
Flask)
AI Integration Any LLM API with tool/functioncalling
support
Hosting Vercel / Netlify (frontend),
Render / Railway (backend)