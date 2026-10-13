// Source-controlled curriculum. Changing published content means adding a new
// version (never editing an assigned one); `npm run content:sql` regenerates
// the seed migration and a test fails if the two drift apart.
import { lesson as m1 } from "./lessons/01-scenes-nodes";
import { lesson as m2 } from "./lessons/02-movement";
import { lesson as m3 } from "./lessons/03-collision";
import { lesson as m4 } from "./lessons/04-input";
import { lesson as m5 } from "./lessons/05-signals";
import { lesson as m6 } from "./lessons/06-state-ui";
import { lesson as m7 } from "./lessons/07-timers";
import { lesson as m8 } from "./lessons/08-loop";
import { readiness } from "./surveys/readiness";
import { project } from "./surveys/project";

export const LESSONS = [m1, m2, m3, m4, m5, m6, m7, m8];
export const SURVEYS = [readiness, project];
