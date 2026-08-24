export interface OrderLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

type GeolocationRequester = Pick<Geolocation, 'getCurrentPosition'>;

export const requestOrderLocation = (
  geolocation: GeolocationRequester | undefined,
): Promise<OrderLocation | undefined> => {
  if (!geolocation) return Promise.resolve(undefined);

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      }),
      () => resolve(undefined),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
      },
    );
  });
};
