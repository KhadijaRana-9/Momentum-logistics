import { json, route } from '../_lib/http.ts';
import { getSession } from '../_lib/auth.ts';

export default route({
  GET: async (req, res) => {
    const session = await getSession(req);
    if (!session) {
      json(res, 200, { user: null });
      return;
    }
    json(res, 200, { user: session });
  },
});
