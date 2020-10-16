class GamError extends Error {
  static defaultMessage: string;
}
class TeamFullError extends GamError {}
TeamFullError.defaultMessage = "Team full";

export { GamError, TeamFullError };
