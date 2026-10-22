-- OPTIONAL: run once after schema.sql. Examples are not verified equipment records.
begin;
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('tester','Single-bearing test rig','Demonstration entry','Component testing','An illustrative bench-scale arrangement for investigating a single railway bearing under controlled rotation and loading.','## Research scope
A demonstration record for organizing research on a single-bearing test arrangement.

## Information to collect
- Verified load and speed ratings
- Bearing and axle interfaces
- Control and measurement architecture

No manufacturer or performance claims are associated with this example.','{"loading":"Under investigation","sensors":"Temperature, vibration (illustrative)","limitations":"Demonstration only; specifications unverified"}'::jsonb,ARRAY['Bearing testing','Concept study']::text[],'[]'::jsonb,'published','public',true);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('tester','Axlebox endurance test bench','Demonstration entry','Endurance testing','An example research record for an axlebox assembly test bench, with space for loading, lubrication, and instrumentation details.','## Research scope
Use this example to document an axlebox endurance test bench after consulting its manufacturer or research publication. Unknown ratings are intentionally blank.','{"bearing":"To be verified","limitations":"No verified source has been added"}'::jsonb,ARRAY['Axlebox','Endurance']::text[],'[]'::jsonb,'published','public',true);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('tester','Bogie suspension test stand','Demonstration entry','System testing','A sample entry exploring how a primary suspension assembly could be represented in a bearing testing environment.','## Research scope
This is an illustrative system-level testing record. It does not represent a real product. Add verified drawings and references before using it for design decisions.','{"suspension":"Arrangement under investigation"}'::jsonb,ARRAY['Primary suspension','System testing']::text[],'[]'::jsonb,'published','public',true);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('bearing','Understanding the axlebox assembly','Demonstration entry','Bearing fundamentals','A starting point for documenting bearings, housings, seals, and the wheelset interface.','## Assembly and interfaces
Document the bearing, axle journal, housing, seals, and retention arrangement for the passenger vehicle under study.

## Research checklist
- Bearing type and geometry
- Lubrication and sealing
- Axle and housing fits
- Maintenance requirements

## Standards and inspection
Add applicable standards and manufacturer instructions after verifying their edition and scope. No standard is asserted here.','{}'::jsonb,ARRAY['Fundamentals']::text[],'[]'::jsonb,'published','public',true);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('suspension','Primary suspension configurations','Demonstration entry','Suspension fundamentals','Explore the connection between the axlebox and bogie frame, and the implications for a representative test setup.','## Configurations to investigate
Compare candidate coil spring, elastomeric, and guided axlebox arrangements using vehicle-specific sources.

## Testing considerations
Record vertical load, displacement, alignment, and boundary conditions for each candidate. The project suspension arrangement has not been selected.','{}'::jsonb,ARRAY['Bogie','Load paths']::text[],'[]'::jsonb,'published','public',true);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('project','Passenger rail bearing tester','Demonstration entry','Project overview','Design a single passenger rail bearing tester incorporating representative primary suspension, controlled bearing rotation, and vertical loading.','## Problem statement
Develop a test rig concept for studying a passenger rail bearing with representative primary suspension and controlled loading.

## Preliminary considerations
- Rotation corresponding to passenger rail operation up to **120 mph**
- Hydraulic vertical loading
- Temperature, vibration, and displacement measurement
- Data acquisition using LabVIEW

These are preliminary considerations, not finalized specifications. The exact suspension arrangement remains under investigation.

## Design requirements
To be defined and reviewed by the team.

## Functional decomposition
Rotate the bearing; apply and react load; represent suspension behavior; measure response; acquire data; provide safe operation.

## Morphological chart
Candidate drive, loading, suspension, and sensing approaches are awaiting team research.

## Conceptual designs
Upload concept sketches and document selection criteria.

## Preliminary engineering calculations
No verified calculations have been recorded. Speed conversion requires an established wheel diameter.

## CAD and component selection
Awaiting candidate components and engineering drawings.

## Future testing plans
Define commissioning, safety review, calibration, and validation procedures before operating a prototype.','{}'::jsonb,ARRAY['Preliminary','Senior design']::text[],'[]'::jsonb,'published','public',false);
insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values ('research','Building our research framework','Demonstration entry','Research notes','A practical checklist for collecting traceable information about existing bearing test equipment.','## Capture the source
Save the original manual, publication, or manufacturer page alongside each entry.

## Keep uncertainty visible
Leave unknown values blank. Distinguish proposed requirements from verified capabilities.

## Compare consistently
Use common units and review the original test conditions before comparing ratings.','{}'::jsonb,ARRAY['Research methods']::text[],'[]'::jsonb,'published','public',true);
commit;
