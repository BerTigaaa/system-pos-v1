CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_notification', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_notification ON notifications;
CREATE TRIGGER trg_notify_notification
AFTER INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION notify_new_notification();
