import { Link } from "react-router-dom";
import { ArrowRightIcon, LandingIcon } from "./LandingIcons";
import type { LandingCapability } from "./landingCapabilities";

type LandingCapabilityCardProps = {
  capability: LandingCapability;
};

export function LandingCapabilityCard({
  capability,
}: LandingCapabilityCardProps) {
  return (
    <article className={`landing-card landing-card--${capability.accent}`}>
      <div className="landing-card__icon" aria-hidden="true">
        <LandingIcon name={capability.icon} />
      </div>
      <p className="landing-card__category">{capability.category}</p>
      <h3 className="landing-card__title">{capability.title}</h3>
      <p className="landing-card__description">{capability.description}</p>
      <Link
        to={capability.path}
        className="landing-card__action"
        aria-label={`Open ${capability.title}`}
      >
        Open feature
        <ArrowRightIcon />
      </Link>
    </article>
  );
}
