import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { handleCorsPreflight, assertAllowedOrigin } from '@/lib/cors';
import { mapUserToProfile, parsePreferences } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';
import { extensionJson, unauthenticated } from '@/server/extension/http';

export const runtime = 'nodejs';

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  const forbidden = assertAllowedOrigin(req);
  if (forbidden) return forbidden;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return unauthenticated(req);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const profile = mapUserToProfile(user);
  const prefs = parsePreferences(user.preferences);

  // Minimum data the autofill engine needs — no raw resume text, no tokens.
  return extensionJson(req, {
    ok: true,
    profile: {
      name: profile.name,
      firstName: profile.name.split(/\s+/)[0] ?? '',
      lastName: profile.name.split(/\s+/).slice(1).join(' ') ?? '',
      email: profile.email,
      university: profile.university,
      graduationYear: profile.graduationYear,
      gpa: profile.gpa,
      skills: profile.skills,
      experiences: profile.experiences.map((experience) => ({
        company: experience.company,
        role: experience.role,
        duration: experience.duration,
      })),
      atsScore: profile.atsScore,
      resumeAvailable: Boolean(user.resumeUrl),
      tailoredResumeAvailable: Boolean(
        (prefs.rawResumeText && prefs.rawResumeText.trim().length > 0) ||
          (prefs.parsedSummary && prefs.parsedSummary.trim().length > 0)
      ),
    },
  });
}
