### Database
- Use PostgreSQL (Supabase) with Drizzle ORM
- Do not attempt to fix database records to work around code issues - fix the root cause in the code
- Ask permission before updating the database to fix a bug
- When encountering data issues, trace back to find and fix the code that caused them


### UI/UX Design Principles
- **Optimistic UI**: Always let users feel they have access to functionality
- **Fail Late, Not Early**: Only show limitations when users actually hit them
- **Remove Friction**: Don't warn about limits upfront - let users try first
- **Progressive Disclosure**: Show upgrade prompts only when limits are reached
- **Example**: For free plan limits (3 YouTube imports/day):
  - ❌ DON'T: Show "3/day limit" badges upfront
  - ✅ DO: Let users enter URL and import, show limit only when exceeded

### Task Management
- Use TodoWrite tool for complex multi-step tasks
- Mark todos as completed immediately after finishing each task
- Only have ONE task in_progress at a time

- Use template strings (backticks) to properly escape strings with quotes, making code searches easier. 
❌ <div> Price is "5$" </div> 
✅ <div> `Price is "5$"` </div> 
- Do not use CSS !important. instead fix the root cause in the code


### File Management
- Prefer editing existing files over creating new ones
- Maintain documentation in PRD section  
- Create Components in same directory as page.jsx - Prefer collocation of assets, components, actions, page.jsx - Avoid catch all "components" directory 