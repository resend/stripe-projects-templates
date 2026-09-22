# Resend templates for Stripe Projects

Starter apps for `stripe projects build` that send email through [Resend](https://resend.com). Each directory is one template variant. The manifests that make them discoverable live in [`stripe/projects-template-registry`](https://github.com/stripe/projects-template-registry); each directory keeps a mirror copy in `projects-template.yaml`.

| Directory | Template | Stack |
| --- | --- | --- |
| `nextjs_saas_paper-plane` | `resend/nextjs-saas` | Vercel, Neon, Clerk, Resend, PostHog |

## Use a template

```bash
stripe plugin install projects
stripe projects build
```

Pick the Resend variant in the SaaS category. The CLI copies the pinned commit, provisions the services, and writes the credentials to `.env.local`.

## Credits

The starters are forks of [`stripe/projects-templates`](https://github.com/stripe/projects-templates), MIT licensed. Each directory carries the upstream `LICENSE`.
